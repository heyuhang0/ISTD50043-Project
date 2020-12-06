# 50043 Book Review Website
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).\
Live Demo Link: http://18.141.203.154/\
This README only documents how to run web server locally, and reploy and run in AWS.\
See **`documentation.pdf`** file for **full running instruction and full documentation.**


# Running Production Web Server Locally

`.env`, `MySQL` and `MongoDB` should be seted up before run production web server.
## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.\
The page will reload if you make edits. You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.\
The build is minified and the filenames include the hashes.Your app is ready to be deployed!\
See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

# Deploy and Run in AWS
  - Start a new instance using <span style="color:red">ami-04613ff1fdcd2eab1</span> (or <span style="color:red">ami-0f82752aa17ff8f5d</span> for us-east-1 region)
  - SSH into the new instance
  - Git clone the project (**You must CLONE it instead of downloading ZIP**) by:
	  ```
	$ git clone https://github.com/heyuhang0/ISTD50043-Project.git  
	$ cd ISTD50043-Project
	```
  
##  Setup the deploy environment 
- The script will prompt you to input your aws credentials and will then install the necessary dependencies. This is not the actual deploy script, and the script is only designed for <span style="color:red">ami-04613ff1fdcd2eab1/ami-0f82752aa17ff8f5d</span> based on the dependencies that should be installed on these 2 amis.
	```
	$ ./scripts/setup_deployer.bash
	```
- Now you are ready to launch the system (please use **python3.7** instead of python3):
	```
	# The script will deploy production (about 5-8 minutes) and cluster
	(about 3-5 minutes) IN PARALLEL. System cannot be launched if there
	already exists one.
	
  # OPTION1
	# If you do not have a pem key
	# you can launch with a new key (keyname must be unique, i.e., <keyname>.pem
	# must not exists in ec2s keypairs)
	# the pem file of the new keypair will be saved at the given path  
	$ python3.7 scripts/deploy.py --newkey <keyname>.pem launch --num-nodes 3  
  
	# OPTION 2
	# If you launched once or already have the pem key file
	# you can use the existing key
	# IMPORTANT:(the filename must be same as the EC2 keypair name with .pem suffix)  
	$ python3.7 scripts/deploy.py --keyfile <path to pem file> launch --num-nodes 3
	```
## Run analytics task

- To run analytics task (it will take about 4-5 minutes, including data ingestion):
	```
	# result of correlation and the url to download tf-idf result 
	# will be printed

	# If you launch with '--newkey <keyname>.pem'
	# then just use '--keyfile <keyname>.pem'
	# i.e., the --keyfile <keyname>.pem must be the pem key used in launching
	# production system and analytics cluster  
	$ python3.7 scripts/deploy.py --keyfile <keyname>.pem analyse
	```

## Scale the cluster

- To scale the cluster (it will take about 5-7 minutes):
	```
	# <n> is number of datanodes after scaling
	# IMPORTANT: the --keyfile <keyname>.pem must be the pem key used in launching
	# production system and analytics cluster
	$ python3.7 scripts/deploy.py --keyfile <keyname>.pem scale --num-nodes <n>
	```
	
## Terminate the system

- To terminate the system:
	```
	# IMPORTANT: the --keyfile <keyname>.pem must be the pem key used in launching
	# production system and analytics cluster
	$ python3.7 scripts/deploy.py --keyfile <keyname>.pem terminate
	```

## Other tips
**IMPORTANT about vCPU exceed limit error**: normal aws user has a vCPU limit of 32 cores at any given time, our production system takes 8 vcpu, and each of the nodes in the analytics cluster has 4 vcpu cores. So theoretically, we can have a maximum of 4 data-nodes for the analytics cluster. **If you want to have more than 4 datanodes, please increase the vCPU limit first.**

  

In addition, **please avoid launching another system immediately after destroying one, wait 30 seconds before doing so**. This may cause the vCPU exceed limit error, due to previous instances not fully terminated yet. In this case, wait 30 second, then destroy the cluster, then wait for another 30 seconds, launch the cluster again, the error should be resolved.

