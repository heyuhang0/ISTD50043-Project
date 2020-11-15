# /usr/bin/env python3
import os
import argparse
import logging
try:
    from .deploy_ec2 import keypair_from_file, keypair_from_str, keypair_create
    from .deploy_ec2 import get_latest_ubuntu_focal_ami, connect_or_setup_instance
except:
    from deploy_ec2 import keypair_from_file, keypair_from_str, keypair_create
    from deploy_ec2 import get_latest_ubuntu_focal_ami, connect_or_setup_instance


logger = logging.getLogger(__name__)


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

    app_name = 'mongodb'
    instance_config = {
        'image_id': get_latest_ubuntu_focal_ami(),
        'instance_type': 't2.micro',
        'disk_size': 20,
        'ip_permissions': [
            {
                'IpProtocol': 'tcp',
                'FromPort': 27017,
                'ToPort': 27017,
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
        'setup_script': os.path.join(project_dir, 'scripts', 'setup', 'setup_mongo.bash')
    }

    ssh, instance_ip = connect_or_setup_instance(app_name, 'ubuntu', ssh_key, instance_config)
    ssh.close()

    logger.info(f'Server {instance_ip} is ready')


if __name__ == "__main__":
    main()
