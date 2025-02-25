import argparse
import logging
import uuid
import time
from pathlib import Path, PurePosixPath
from deploy_production import EC2Config, EC2KeyPair, EC2SSHConfig, EC2Instance
from deploy_production import FutureValue, run_in_parallel


CORE_SITE_XML = """<?xml version=\"1.0\"?>
<?xml-stylesheet type=\"text/xsl\" href=\"configuration.xsl\"?>
<\x21-- Put site-specific property overrides in this file. -->
<configuration>
<property>
<name>fs.defaultFS</name>
<value>hdfs://{}:9000</value>
</property>
</configuration>
"""

HDFS_SITE_XML = """<?xml version=\"1.0\"?>
<?xml-stylesheet type=\"text/xsl\" href=\"configuration.xsl\"?>
<\x21-- Put site-specific property overrides in this file. -->
<configuration>
<property>
<name>dfs.replication</name>
<value>3</value>
</property>
<property>
<name>dfs.namenode.name.dir</name>
<value>file:/mnt/hadoop/namenode</value>
</property>
<property>
<name>dfs.datanode.data.dir</name>
<value>file:/mnt/hadoop/datanode</value>
</property>
</configuration>
"""

YARN_SITE_XML = """<?xml version=\"1.0\"?>
<?xml-stylesheet type=\"text/xsl\" href=\"configuration.xsl\"?>
<\x21-- Put site-specific property overrides in this file. -->
<configuration>
<\x21-- Site specific YARN configuration properties -->
<property>
<name>yarn.nodemanager.aux-services</name>
<value>mapreduce_shuffle</value>
<description>Tell NodeManagers that there will be an auxiliary
service called mapreduce.shuffle
that they need to implement
</description>
</property>
<property>
<name>yarn.nodemanager.aux-services.mapreduce_shuffle.class</name>
<value>org.apache.hadoop.mapred.ShuffleHandler</value>
<description>A class name as a means to implement the service
</description>
</property>
<property>
<name>yarn.resourcemanager.hostname</name>
<value>{}</value>
</property>
</configuration>
"""

MAPRED_SITE_XML = """<?xml version=\"1.0\"?>
<?xml-stylesheet type=\"text/xsl\" href=\"configuration.xsl\"?>
<\x21-- Put site-specific property overrides in this file. -->
<configuration>
<\x21-- Site specific YARN configuration properties -->
<property>
<name>mapreduce.framework.name</name>
<value>yarn</value>
<description>Use yarn to tell MapReduce that it will run as a YARN application
</description>
</property>
<property>
<name>yarn.app.mapreduce.am.env</name>
<value>HADOOP_MAPRED_HOME=/opt/hadoop-3.3.0/</value>
</property>
<property>
<name>mapreduce.map.env</name>
<value>HADOOP_MAPRED_HOME=/opt/hadoop-3.3.0/</value>
</property>
<property>
<name>mapreduce.reduce.env</name>
<value>HADOOP_MAPRED_HOME=/opt/hadoop-3.3.0/</value>
</property>
</configuration>
"""

SPARK_ENV_SH = """
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
export HADOOP_HOME=/opt/hadoop-3.3.0
export SPARK_HOME=/opt/spark-3.0.1-bin-hadoop3.2
export SPARK_CONF_DIR=${{SPARK_HOME}}/conf
export HADOOP_CONF_DIR=${{HADOOP_HOME}}/etc/hadoop
export YARN_CONF_DIR=${{HADOOP_HOME}}/etc/hadoop
export SPARK_EXECUTOR_INSTANCES={num_instances}
export SPARK_EXECUTOR_CORES=4
export SPARK_EXECUTOR_MEMORY=6G
export SPARK_DRIVER_MEMORY=4G
export PYSPARK_PYTHON=python3
"""


def launch(ssh_config: EC2SSHConfig, num_nodes: int):
    logger = logging.getLogger('launch')
    logger.info(f'Launching cluster with {num_nodes} data nodes')

    if EC2Instance('name-node', ssh_config, logger).exists:
        logger.error('Cluster already exists')
        exit(1)

    hostname_template = 'com.example.{}'

    name_node_hostname = hostname_template.format('name-node')
    name_node_ip = FutureValue()
    name_node_public_ip = FutureValue()
    name_node_pubkey = FutureValue()

    data_node_hostnames = [hostname_template.format(f'data-node{i}') for i in range(num_nodes)]
    data_node_ips = [FutureValue() for _ in range(num_nodes)]
    data_node_public_ips = [FutureValue() for _ in range(num_nodes)]
    data_nodes_ssh_ready = [FutureValue() for _ in range(num_nodes)]
    data_nodes_hadoop_build_ready = [FutureValue() for _ in range(num_nodes)]
    data_nodes_hadoop_setup_ready = [FutureValue() for _ in range(num_nodes)]
    data_nodes_spark_build_ready = [FutureValue() for _ in range(num_nodes)]
    data_nodes_spark_setup_ready = [FutureValue() for _ in range(num_nodes)]

    def get_hosts():
        hosts = f'\n{name_node_ip.get()}\t{name_node_hostname}'
        for ip, hostname in zip(data_node_ips, data_node_hostnames):
            hosts += f'\n{ip.get()}\t{hostname}'
        return hosts

    def launch_name_node():
        logger = logging.getLogger('@name-node')
        name_node = EC2Instance('name-node', ssh_config, logger)
        name_node.launch(
            EC2Config(
                image_id=EC2Config.get_latest_ubuntu_ami(),
                instance_type='t2.xlarge')
            .with_storage(volume_size=32)
            .with_inbound_rule('tcp', 22)
            .with_inbound_rule('tcp', 80)
            .with_inbound_rule('-1', -1, '172.31.0.0/16')
            .with_user_data('\n'.join([
                "#!/bin/bash",
                "sysctl vm.swappiness=10",
                "wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -",
                'source /etc/os-release'
                + ' && echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu'
                + ' $VERSION_CODENAME/mongodb-org/4.4 multiverse"'
                + ' | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list',
                "echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections",
                "apt update -qq -y && apt install -qq -y "
                + 'openjdk-8-jdk python-is-python3 python3-pip mongodb-database-tools mysql-client-8.0 apache2',
            ])), wait_init=False)
        name_node_ip.set(name_node.private_ip)
        name_node_public_ip.set(name_node.public_ip)

        # Setup SSH keys
        name_node.run_command('[[ ! -f "$HOME/.ssh/id_rsa" ]] && ssh-keygen -t rsa -q -f "$HOME/.ssh/id_rsa" -N "" || true')
        name_node.run_command('export PUB_KEY=$(cat $HOME/.ssh/id_rsa.pub)')
        name_node_pubkey.set(name_node.export_variable('PUB_KEY'))
        name_node.import_variable(NAMENODE_PUB_KEY=name_node_pubkey.get())
        name_node.run_command('echo $NAMENODE_PUB_KEY | tee -a ~/.ssh/authorized_keys')

        # Config Hosts
        name_node.import_variable(HOSTS=get_hosts())
        name_node.run_command('echo "$HOSTS" | sudo tee -a /etc/hosts')

        # Download and config Hadoop
        name_node.run_command('cd ~ && mkdir -p download && cd download')
        name_node.run_command('wget -q -c https://d2bhhe2sy3r8ii.cloudfront.net/hadoop-3.3.0.tar.gz')
        name_node.run_command('tar -zxf hadoop-3.3.0.tar.gz')
        name_node.import_variable(JH="\\/usr\\/lib\\/jvm\\/java-8-openjdk-amd64")
        name_node.run_command('sed -i "s/# export JAVA_HOME=.*/export\\ JAVA_HOME=${JH}/g" \\hadoop-3.3.0/etc/hadoop/hadoop-env.sh')

        name_node.import_variable(CORE_SITE_XML=CORE_SITE_XML.format(name_node_hostname))
        name_node.run_command('echo -e "$CORE_SITE_XML" > hadoop-3.3.0/etc/hadoop/core-site.xml')

        name_node.import_variable(HDFS_SITE_XML=HDFS_SITE_XML)
        name_node.run_command('echo -e "$HDFS_SITE_XML" > hadoop-3.3.0/etc/hadoop/hdfs-site.xml')

        name_node.import_variable(YARN_SITE_XML=YARN_SITE_XML.format(name_node_hostname))
        name_node.run_command('echo -e "$YARN_SITE_XML" > hadoop-3.3.0/etc/hadoop/yarn-site.xml')

        name_node.import_variable(MAPRED_SITE_XML=MAPRED_SITE_XML)
        name_node.run_command('echo -e "$MAPRED_SITE_XML" > hadoop-3.3.0/etc/hadoop/mapred-site.xml')

        name_node.run_command('rm hadoop-3.3.0/etc/hadoop/workers')
        for host in data_node_hostnames:
            name_node.run_command(f'echo -e "{host}" >> hadoop-3.3.0/etc/hadoop/workers')

        # Distributing the configured library
        name_node.run_command('tar czf hadoop-3.3.0.tgz hadoop-3.3.0')
        for i, host in enumerate(data_node_hostnames):
            data_nodes_ssh_ready[i].get()
            name_node.run_command(f'scp -o StrictHostKeyChecking=no hadoop-3.3.0.tgz {host}:.')
            data_nodes_hadoop_build_ready[i].set(True)
        name_node.run_command('cp hadoop-3.3.0.tgz ~/')
        name_node.run_command('cd')

        # Install Hadoop
        name_node.run_command('cd && tar zxf hadoop-3.3.0.tgz')
        name_node.run_command('sudo rm -rf /opt/hadoop-3.3.0 && sudo mv hadoop-3.3.0 /opt/')

        name_node.run_command('sudo mkdir -p /mnt/hadoop/namenode/hadoop-${USER}')
        name_node.run_command('sudo chown -R ${USER}:${USER} /mnt/hadoop/namenode')

        # Setup a Multi-node Spark cluster
        # Download
        name_node.run_command('cd ~/download')
        name_node.run_command('wget -q -c https://d2bhhe2sy3r8ii.cloudfront.net/spark-3.0.1-bin-hadoop3.2.tgz')
        name_node.run_command('tar zxf spark-3.0.1-bin-hadoop3.2.tgz')

        # Configuration
        name_node.run_command('cp spark-3.0.1-bin-hadoop3.2/conf/spark-env.sh.template spark-3.0.1-bin-hadoop3.2/conf/spark-env.sh')
        name_node.import_variable(SPARK_ENV_SH=SPARK_ENV_SH.format(num_instances=num_nodes))
        name_node.run_command('echo -e "$SPARK_ENV_SH" >> spark-3.0.1-bin-hadoop3.2/conf/spark-env.sh')

        for host in data_node_hostnames:
            name_node.run_command(f'echo -e {host} >> spark-3.0.1-bin-hadoop3.2/conf/slaves')

        # Distribute the configured spark
        name_node.run_command('tar czf spark-3.0.1-bin-hadoop3.2.tgz spark-3.0.1-bin-hadoop3.2/')
        for i, host in enumerate(data_node_hostnames):
            name_node.run_command(f'scp spark-3.0.1-bin-hadoop3.2.tgz {host}:./spark-3.0.1-bin-hadoop3.2.tgz')
            data_nodes_spark_build_ready[i].set(True)
        name_node.run_command('mv spark-3.0.1-bin-hadoop3.2.tgz ~/ && cd')

        # Install Spark
        name_node.run_command('cd && tar zxf spark-3.0.1-bin-hadoop3.2.tgz')
        name_node.run_command('sudo rm -rf /opt/spark-3.0.1-bin-hadoop3.2 && sudo mv spark-3.0.1-bin-hadoop3.2 /opt/')
        name_node.run_command('sudo chown -R ${USER}:${USER} /opt/spark-3.0.1-bin-hadoop3.2')

        # Wait for cloud init and apt install in user data
        name_node.wait_for_cloud_init()

        # Install PySpark
        name_node.run_command('pip3 install pyspark')
        name_node.run_command('sudo -H pip3 install numpy')

        # Config Apache2 (Used for download results)
        name_node.run_command("sudo sed -i 's/Options Indexes/Options/g' /etc/apache2/apache2.conf")
        name_node.run_command('sudo service apache2 restart')
        name_node.run_command('sudo rm /var/www/html/index.html && sudo mkdir /var/www/html/results')

        # Start Hadoop
        for ready in data_nodes_hadoop_setup_ready:
            ready.get()
        name_node.run_command('yes | /opt/hadoop-3.3.0/bin/hdfs namenode -format')
        name_node.run_command('/opt/hadoop-3.3.0/sbin/start-dfs.sh && /opt/hadoop-3.3.0/sbin/start-yarn.sh')
        name_node.run_command('/opt/hadoop-3.3.0/bin/hdfs dfsadmin -report')

        # Start Spark
        for ready in data_nodes_spark_setup_ready:
            ready.get()
        name_node.run_command('/opt/spark-3.0.1-bin-hadoop3.2/sbin/start-all.sh')

    def launch_data_node(index: int):
        def do_launch_data_node():
            logger = logging.getLogger(f'@data-node{index}')
            data_node = EC2Instance(f'data-node{index}', ssh_config, logger)
            data_node.launch(
                EC2Config(
                    image_id=EC2Config.get_latest_ubuntu_ami(),
                    instance_type='t2.xlarge')
                .with_storage(volume_size=32)
                .with_inbound_rule('tcp', 22)
                .with_inbound_rule('-1', -1, '172.31.0.0/16')
                .with_user_data('\n'.join([
                    "#!/bin/bash",
                    "sysctl vm.swappiness=10",
                    "echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections",
                    "apt update -qq -y && apt install -qq -y "
                    + 'openjdk-8-jdk python-is-python3 python3-pip'
                ])), wait_init=False)
            data_node_ips[index].set(data_node.private_ip)
            data_node_public_ips[index].set(data_node.public_ip)

            # Config Hosts
            data_node.import_variable(HOSTS=get_hosts())
            data_node.run_command('echo "$HOSTS" | sudo tee -a /etc/hosts')

            # Setup SSH keys
            data_node.import_variable(NAMENODE_PUB_KEY=name_node_pubkey.get())
            data_node.run_command('echo $NAMENODE_PUB_KEY | tee -a ~/.ssh/authorized_keys')
            data_nodes_ssh_ready[index].set(True)

            # Install Hadoop
            data_nodes_hadoop_build_ready[index].get()
            data_node.run_command('cd && tar zxf hadoop-3.3.0.tgz')
            data_node.run_command('sudo rm -rf /opt/hadoop-3.3.0 && sudo mv hadoop-3.3.0 /opt/')

            data_node.run_command('sudo mkdir -p /mnt/hadoop/datanode/')
            data_node.run_command('sudo chown -R ${USER}:${USER} /mnt/hadoop/datanode/')

            # Install Spark
            data_nodes_spark_build_ready[index].get()
            data_node.run_command('cd && tar zxf spark-3.0.1-bin-hadoop3.2.tgz')
            data_node.run_command('sudo rm -rf /opt/spark-3.0.1-bin-hadoop3.2 && sudo mv spark-3.0.1-bin-hadoop3.2 /opt/')
            data_node.run_command('sudo chown -R ${USER}:${USER} /opt/spark-3.0.1-bin-hadoop3.2')

            # Wait for cloud init and apt install to finish
            data_node.wait_for_cloud_init()
            data_nodes_hadoop_setup_ready[index].set(True)

            # Install PySpark
            data_node.run_command('pip3 install pyspark')
            data_node.run_command('sudo -H pip3 install numpy')
            data_nodes_spark_setup_ready[index].set(True)

        return do_launch_data_node

    run_in_parallel(launch_name_node, *[launch_data_node(i) for i in range(num_nodes)])

    print('\n\x1b[6;30;42m' + 'Spark Cluster is Ready!' + '\x1b[0m')
    print('\x1b[1;32;40m●\x1b[0m Spark Cluster')
    print(f'{name_node_public_ip.get()}\t{name_node_hostname}')
    for ip, hostname in zip(data_node_public_ips, data_node_hostnames):
        print(f'{ip.get()}\t{hostname}')


def scale(ssh_config: EC2SSHConfig, num_nodes: int):
    logger = logging.getLogger('scale')
    logger.info(f'Scaling cluster to {num_nodes} data nodes')

    terminate(ssh_config)
    logger.info('Waitting for instances to be really terminated')
    time.sleep(45)
    logger.info('Launching new cluster')
    launch(ssh_config, num_nodes)


def terminate(ssh_config: EC2SSHConfig):
    logger = logging.getLogger('terminate')
    logger.info(f'Terminating cluster')

    # Terminate data nodes
    not_found_count = 0
    data_node_id = 0
    while not_found_count < 3:
        data_node = EC2Instance(f'data-node{data_node_id}', ssh_config, logger)
        if data_node.exists:
            logger.info(f'Terminating data node {data_node_id}')
            data_node.terminate()
            not_found_count = 0
        else:
            not_found_count += 1
        data_node_id += 1

    # Terminate name node
    name_node = EC2Instance(f'name-node', ssh_config, logger)
    if name_node.exists:
        logger.info(f'Terminating name node')
        name_node.terminate()


def analyse(ssh_config: EC2SSHConfig, debug: bool = False):
    logger = logging.getLogger('analyse')
    logger.info(f'Starting the ingestion and analytic tasks')

    project_base = Path(__file__).absolute().parent.parent

    reviews_ready = FutureValue()
    tf_idf_result = FutureValue()
    correlation_result = FutureValue()

    def analyse_tf_idf():
        # Get MySQL credentials
        mysql_instance = EC2Instance('mysql', ssh_config, logger)
        if not mysql_instance.exists:
            raise Exception('Can not find MySQL instance')
        mysql_instance.run_command('source ~/.credentials')
        mysql_ip = mysql_instance.private_ip
        mysql_database = mysql_instance.export_variable('MYSQL_DB')
        mysql_username = mysql_instance.export_variable('MYSQL_USR')
        mysql_password = mysql_instance.export_variable('MYSQL_PWD')

        # Connect to cluster
        name_node = EC2Instance('name-node', ssh_config, logger)
        if not name_node.exists:
            raise Exception('Cluster not found')

        # Export reviews data
        name_node.import_variable(MYSQL_PWD=mysql_password)
        name_node.run_command(
            f'mysql -u {mysql_username} -h {mysql_ip}'
            f' -e "select * from {mysql_database}.review" | tail -n +2 > review.csv')

        # Put data to hdfs
        name_node.run_command('/opt/hadoop-3.3.0/bin/hdfs dfs -mkdir -p /DBProject')
        name_node.run_command('/opt/hadoop-3.3.0/bin/hdfs dfs -put -f review.csv /DBProject/review.csv')
        reviews_ready.set(True)

        # Run tf-idf
        name_node.upload_file(project_base/'scripts'/'analytics'/'tfidf.py', PurePosixPath('tfidf.py'))
        name_node.run_command('/opt/hadoop-3.3.0/bin/hdfs dfs -rm -r -f /DBProject/tfidf_output')
        if debug:
            name_node.run_command('python tfidf.py')
        else:
            name_node.run_command('/opt/spark-3.0.1-bin-hadoop3.2/bin/spark-submit --master yarn tfidf.py')

        # Get results
        name_node.run_command('rm -rf tfidf_output.csv')
        name_node.run_command('/opt/hadoop-3.3.0/bin/hdfs dfs -getmerge /DBProject/tfidf_output tfidf_output.csv')

        # Move result to web folder
        result_id = str(uuid.uuid4())
        name_node.run_command('sudo rm -rf /var/www/html/results/*')
        name_node.run_command(f'sudo mkdir -p /var/www/html/results/{result_id}')
        name_node.run_command(f'sudo mv tfidf_output.csv /var/www/html/results/{result_id}')
        tf_idf_result.set(f'http://{name_node.public_ip}/results/{result_id}/tfidf_output.csv')

    def analyse_correlation():
        # Get MongoDB credentials
        mongo_instance = EC2Instance('mongodb', ssh_config, logger)
        if not mongo_instance.exists:
            logger.error('Can not find MongoDB instance')
            exit(1)
        mongo_instance.run_command('source ~/.credentials')
        db_name = mongo_instance.export_variable('MONGO_DB')
        db_user = mongo_instance.export_variable('MONGO_USR')
        db_pass = mongo_instance.export_variable('MONGO_PWD')
        mongo_url = f'mongodb://{db_user}:{db_pass}@{mongo_instance.private_ip}:27017/{db_name}?authSource={db_name}'

        # Connect to cluster
        name_node = EC2Instance('name-node', ssh_config, logger)
        if not name_node.exists:
            raise Exception('Cluster not found')

        # Download books data
        name_node.run_command(f'mongoexport --collection=books --out=books.json {mongo_url}')

        # Put books data to hdfs
        name_node.run_command('/opt/hadoop-3.3.0/bin/hdfs dfs -mkdir -p /DBProject')
        name_node.run_command('/opt/hadoop-3.3.0/bin/hdfs dfs -put -f books.json /DBProject/books.json')

        # Wait for reviews data to be ready
        reviews_ready.get()

        # Run correlation
        name_node.import_variable(PYTHONHASHSEED='1')
        name_node.upload_file(project_base/'scripts'/'analytics'/'correlation.py', PurePosixPath('correlation.py'))
        name_node.run_command('/opt/hadoop-3.3.0/bin/hdfs dfs -rm -r -f /DBProject/correlation_output')
        if debug:
            name_node.run_command('python correlation.py')
        else:
            name_node.run_command('/opt/spark-3.0.1-bin-hadoop3.2/bin/spark-submit --master yarn correlation.py')

        # Get results
        name_node.run_command('rm -rf correlation_output.txt')
        name_node.run_command('/opt/hadoop-3.3.0/bin/hdfs dfs -getmerge /DBProject/correlation_output correlation_output.txt')
        correlation_result.set(name_node.export_variable('(tail -n 1 correlation_output.txt)'))

    run_in_parallel(analyse_tf_idf, analyse_correlation)

    print('\n\x1b[6;30;42m' + 'Success!' + '\x1b[0m')
    print('correlation:', correlation_result.get())
    print('tf-idf:     ', tf_idf_result.get())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true')
    keypair_group = parser.add_mutually_exclusive_group(required=True)
    keypair_group.add_argument('--keyfile', type=EC2KeyPair.from_file)
    keypair_group.add_argument('--key', type=EC2KeyPair.from_str)
    subparsers = parser.add_subparsers(required=True, dest='action')
    launch_parser = subparsers.add_parser('launch')
    launch_parser.add_argument('--num-nodes', type=int, required=True)
    scale_parser = subparsers.add_parser('scale')
    scale_parser.add_argument('--num-nodes', type=int, required=True)
    subparsers.add_parser('analyse')
    subparsers.add_parser('terminate')
    args = parser.parse_args()

    keypair = args.keyfile or args.key
    ssh_config = EC2SSHConfig(keypair, username='ubuntu', port=22)

    if args.action == 'launch':
        launch(ssh_config, args.num_nodes)
    elif args.action == 'scale':
        scale(ssh_config, args.num_nodes)
    elif args.action == 'terminate':
        terminate(ssh_config)
    elif args.action == 'analyse':
        analyse(ssh_config, args.debug)


if __name__ == "__main__":
    main()
