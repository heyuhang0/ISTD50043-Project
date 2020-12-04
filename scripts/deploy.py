import argparse
from deploy_production import run_in_parallel, EC2SSHConfig, EC2KeyPair
from deploy_production import launch as launch_production
from deploy_production import terminate as terminate_production
from deploy_cluster import launch as launch_cluster
from deploy_cluster import terminate as terminate_cluster
from deploy_cluster import scale as scale_cluster
from deploy_cluster import analyse



def launch_all(ssh_config: EC2SSHConfig, num_nodes: int):
    run_in_parallel(
        lambda: launch_production(ssh_config),
        lambda: launch_cluster(ssh_config, num_nodes)
    )


def terminate_all(ssh_config: EC2SSHConfig):
    terminate_cluster(ssh_config)
    terminate_production(ssh_config)


def main():
    parser = argparse.ArgumentParser()
    keypair_group = parser.add_mutually_exclusive_group(required=True)
    keypair_group.add_argument('--keyfile', type=EC2KeyPair.from_file)
    keypair_group.add_argument('--key', type=EC2KeyPair.from_str)
    keypair_group.add_argument('--newkey', type=EC2KeyPair.new, dest='new_key_path')
    parser.add_argument('--debug', action='store_true')
    subparsers = parser.add_subparsers(required=True, dest='action')
    launch_parser = subparsers.add_parser('launch')
    launch_parser.add_argument('--num-nodes', type=int, required=True)
    scale_parser = subparsers.add_parser('scale')
    scale_parser.add_argument('--num-nodes', type=int, required=True)
    subparsers.add_parser('analyse')
    subparsers.add_parser('terminate')
    args = parser.parse_args()

    keypair = args.keyfile or args.key or args.new_key_path
    ssh_config = EC2SSHConfig(keypair, username='ubuntu', port=22)

    if args.action == 'launch':
        launch_all(ssh_config, args.num_nodes)
    elif args.action == 'scale':
        scale_cluster(ssh_config, args.num_nodes)
    elif args.action == 'terminate':
        terminate_all(ssh_config)
    elif args.action == 'analyse':
        analyse(ssh_config, args.debug)


if __name__ == "__main__":
    main()
