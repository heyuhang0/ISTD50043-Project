# /usr/bin/env python3
import os
import io
import time
import hashlib
import logging
import threading
import argparse
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
    t_out = threading.Thread(target=channel_logger, args=(logger.info, stdout))
    t_err = threading.Thread(target=channel_logger, args=(logger.error, stderr))
    t_out.start()
    t_err.start()
    t_out.join()
    t_err.join()


def connect_or_setup_instance(app_name, username, ssh_key, instance_config):
    logger.info(f'Connecting to {app_name} instance')

    # Found existing instance and connect ssh
    ec2 = boto3.client('ec2')
    instances = get_app_instances(ec2, app_name)
    if len(instances) > 0:
        logger.info('Found existing instance')
        instance_ip = instances[0]['PublicIpAddress']
        return ssh_connect_with_retry(instance_ip, username, ssh_key)

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

    logger.info(f'Running {setup_script} on the new instance:')
    _, stdout, stderr = ssh.exec_command(f'chmod +x {remote_path} && sudo {remote_path}')
    log_channels(logging.getLogger(instance_ip), stdout, stderr)

    return ssh


def main():
    logging.basicConfig(
        format='%(asctime)s %(name)-12s %(levelname)-8s %(message)s',
        level=logging.INFO
    )

    parser = argparse.ArgumentParser()
    keypair_group = parser.add_mutually_exclusive_group(required=True)
    keypair_group.add_argument('--keyfile', type=keypair_from_file)
    keypair_group.add_argument('--key', type=keypair_from_str)
    keypair_group.add_argument('--newkey', type=keypair_create, dest='new_key_path')
    args = parser.parse_args()

    key_name, ssh_key = args.keyfile or args.key or args.new_key_path

    app_name = 'web-server'
    instance_config = {
        'image_id': get_latest_ubuntu_focal_ami(),
        'instance_type': 't2.micro',
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
        'setup_script': os.path.join(
            os.path.dirname(__file__), 'setup', 'setup_web.bash')
    }

    ssh = connect_or_setup_instance(app_name, 'ubuntu', ssh_key, instance_config)

    _, stdout, stderr = ssh.exec_command('npm help')
    log_channels(logger, stdout, stderr)

    ssh.close()


if __name__ == "__main__":
    main()
