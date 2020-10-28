# /usr/bin/env python3
import os
import io
import time
import hashlib
import logging
import threading
import argparse
import subprocess
import paramiko
import boto3

logger = logging.getLogger(__name__)


def get_security_group(ec2, app_name, ip_permissions):
    ''' returns id of a security group with given ip_permissions
    reuse existing group if exists, create a new one otherwise

    sample ip_permissions: [
        {
            'IpProtocol': 'tcp',
            'FromPort': 80,
            'ToPort': 80,
            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
        },
        {
            'IpProtocol': 'tcp',
            'FromPort': 22,
            'ToPort': 22,
            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
        }
    ]
    '''
    rule_id = hashlib.md5(str(ip_permissions).encode('utf-8')).hexdigest()[:8]
    group_name = app_name + '-' + rule_id

    # return existing group if exists
    response = ec2.describe_security_groups(Filters=[{
        'Name': 'group-name',
        'Values': [group_name]}
    ])
    if len(response['SecurityGroups']) > 0:
        return response['SecurityGroups'][0]['GroupId']

    # Create new security group
    response = ec2.create_security_group(GroupName=group_name, Description=group_name)
    security_group_id = response['GroupId']
    ec2.authorize_security_group_ingress(
        GroupId=security_group_id,
        IpPermissions=ip_permissions
    )
    return security_group_id


def get_app_instances(ec2, app_name):
    response = ec2.describe_instances(Filters=[{
        'Name': 'tag:app_name',
        'Values': [app_name]
    }])
    instances = []
    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            if instance['State']['Name'] == 'running':
                instances.append(instance)
    return instances


def create_app_instance(ec2, app_name, config):
    response = ec2.run_instances(
        ImageId=config['image_id'],
        InstanceType=config['instance_type'],
        MinCount=1,
        MaxCount=1,
        BlockDeviceMappings=[{
            'DeviceName': '/dev/sda1',
            'Ebs': {
                'DeleteOnTermination': True,
                'VolumeSize': config['disk_size'],
                'VolumeType': 'gp2'
            },
        }],
        SecurityGroupIds=[
            get_security_group(ec2, app_name, config['ip_permissions'])
        ],
        TagSpecifications=[{
            'ResourceType': 'instance',
            'Tags': [
                {
                    'Key': 'app_name',
                    'Value': app_name
                },
            ]
        }],
        KeyName=config['key_name']
    )
    return response['Instances'][0]


def keypair_from_file(filename):
    f = argparse.FileType('r')(filename)
    name = os.path.basename(f.name).replace('.pem', '')
    key = paramiko.RSAKey.from_private_key(f)
    return name, key


def keypair_from_str(key):
    name, key_str = key.split(':')
    key = paramiko.RSAKey.from_private_key(io.StringIO(key_str))
    return name, key


def keypair_create(filename):
    f = argparse.FileType('x')(filename)
    name = os.path.basename(f.name).replace('.pem', '')
    logger.info(f'Creating a new EC2 key pair {name}...')
    keypair = boto3.client('ec2').create_key_pair(KeyName=name)
    f.writelines(keypair['KeyMaterial'])
    f.close()
    logger.info(f'Saved EC2 key pair to {filename}')
    key = paramiko.RSAKey.from_private_key_file(filename)
    return name, key


def get_latest_ubuntu_focal_ami():
    ec2 = boto3.client('ec2')
    images = ec2.describe_images(Filters=[{
        'Name': 'name',
        'Values': ['ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server*']
    }])
    return sorted(images['Images'], key=lambda i: i['CreationDate'])[-1]['ImageId']


def ssh_connect_with_retry(ip_address, username, private_key, retries=3, interval=5):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    for _ in range(retries):
        try:
            logger.info(f'SSH into the instance: {ip_address}')
            ssh.connect(ip_address, username=username, pkey=private_key)
            return ssh
        except Exception as e:
            logger.error(e)
            logger.info(f'Retrying in {interval} seconds...')
            time.sleep(interval)
    return None


def log_channels(logger, stdout, stderr):
    def channel_logger(logger_func, channel):
        while True:
            line = channel.readline()
            if not line:
                break
            logger_func(line.rstrip())
    t_err = threading.Thread(target=channel_logger, args=(logger.warning, stderr))
    t_err.start()
    try:
        channel_logger(logger.info, stdout)
        t_err.join()
    except KeyboardInterrupt:
        stderr.close()
        raise


def command_to_convert_CRLF(filename):
    return 'ex -bsc \'%!awk "{sub(/\\r/,\\"\\")}1"\' -cx ' + filename


def connect_or_setup_instance(app_name, username, ssh_key, instance_config):
    logger.info(f'Connecting to {app_name} instance')

    # Found existing instance and connect ssh
    ec2 = boto3.client('ec2')
    instances = get_app_instances(ec2, app_name)
    if len(instances) > 0:
        logger.info('Found existing instance')
        instance_ip = instances[0]['PublicIpAddress']
        return ssh_connect_with_retry(instance_ip, username, ssh_key), instance_ip

    # Create a new instance with given config
    logger.info('Creating a new instance...')
    create_app_instance(ec2, app_name, instance_config)
    while len(instances) == 0:
        logger.info('Waitting for the instance to be running...')
        time.sleep(10)
        instances = get_app_instances(ec2, app_name)
    instance_ip = instances[0]['PublicIpAddress']
    ssh = ssh_connect_with_retry(instance_ip, username, ssh_key)

    # Setup server
    logger.info('Setting up the new instance...')
    sftp = ssh.open_sftp()
    setup_script = instance_config['setup_script']
    remote_path = '/tmp/setup_script'
    sftp.put(setup_script, remote_path)
    sftp.close()

    logger.info(f'Running {os.path.basename(setup_script)} on the new instance:')
    _, stdout, stderr = ssh.exec_command(' && '.join([
        command_to_convert_CRLF(remote_path),
        f'chmod +x {remote_path}',
        f'sudo {remote_path}'
    ]))
    log_channels(logging.getLogger(f'@{app_name}'), stdout, stderr)

    return ssh, instance_ip


def main():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s.%(msecs)03d  %(name)-12s %(levelname)-8s %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    parser = argparse.ArgumentParser()
    keypair_group = parser.add_mutually_exclusive_group(required=True)
    keypair_group.add_argument('--keyfile', type=keypair_from_file)
    keypair_group.add_argument('--key', type=keypair_from_str)
    keypair_group.add_argument('--newkey', type=keypair_create, dest='new_key_path')
    args = parser.parse_args()

    key_name, ssh_key = args.keyfile or args.key or args.new_key_path

    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    app_name = 'web-server'
    instance_config = {
        'image_id': get_latest_ubuntu_focal_ami(),
        'instance_type': 't2.small',
        'disk_size': 8,
        'ip_permissions': [
            {
                'IpProtocol': 'tcp',
                'FromPort': 80,
                'ToPort': 80,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            },
            {
                'IpProtocol': 'tcp',
                'FromPort': 22,
                'ToPort': 22,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }
        ],
        'key_name': key_name,
        'setup_script': os.path.join(project_dir, 'scripts', 'setup', 'setup_web.bash')
    }

    ssh, instance_ip = connect_or_setup_instance(app_name, 'ubuntu', ssh_key, instance_config)

    archive_path = os.path.join(project_dir, 'temp_archive.tar.gz')
    remote_path = 'app.tar.gz'
    p = subprocess.Popen(['git', 'archive', '-o', archive_path, 'HEAD'], cwd=project_dir)
    p.wait()
    if p.returncode != 0:
        logger.critical(f'Failed to create project archive: {p.stderr}')
        exit(1)

    sftp = ssh.open_sftp()
    sftp.put(archive_path, remote_path)
    sftp.close()
    os.remove(archive_path)

    logger.info('Deploying... This could takes a few minutes')
    deploy_script = './scripts/deploy_local.bash'
    _, stdout, stderr = ssh.exec_command(' && '.join([
        'rm -rf app',
        'mkdir app',
        f'tar -xf {remote_path} -C app',
        'cd ./app',
        command_to_convert_CRLF(deploy_script),
        f'chmod +x {deploy_script}',
        f'sudo {deploy_script}'
    ]))
    log_channels(logging.getLogger(f'@{app_name}'), stdout, stderr)
    ssh.close()

    logger.info(f'Done! You can now access http://{instance_ip}')


if __name__ == "__main__":
    main()
