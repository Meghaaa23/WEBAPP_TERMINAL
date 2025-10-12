# CIA Triad Web Application - Network Security Demo

## Project Overview
This project is a **web application** designed to provide an interactive learning experience about the **CIA Triad (Confidentiality, Integrity, and Availability)**, which are fundamental principles of cybersecurity. The application demonstrates various **sniffing, spoofing, and Denial-of-Service (DoS)** attacks in a simulated network environment, featuring two embedded terminals: **Host A (Attacker)** with IP address `10.4.0.7`, and **Host B (Defender)** with IP address `10.4.0.9`. The demo was created for high school students to offer practical insights into cybersecurity attacks and defenses.

## Features
- **CIA Triad Overview**: A user-friendly interface providing basic information on Confidentiality, Integrity, and Availability.
- **Interactive Network Attack Simulation**: Two terminals representing Host A (Attacker) and Host B (Defender) where users can observe network attacks in real time.
- **Sniffing, Spoofing, and DoS Attacks**: Demonstrates key network attacks and the corresponding defense mechanisms.
- **Virtual Environment**: The setup is hosted on virtual machines (VMs) in Azure for real-world simulation.

## Set-up Instructions

### Prerequisites
1. **Azure Virtual Machines**: Create three virtual machines in Azure.
2. **Download Private Keys**: Ensure the `.pem` private key files are downloaded for secure access to the VMs.

### Step 1: VM Setup
- **VM 1 (Main Host)**: This will act as the main host to serve the web application interface.
- **VM 2 (Host A - Attacker)**: This VM simulates the attacker’s role in the network.
- **VM 3 (Host B - Defender)**: This VM simulates the defender’s role in the network.

### Step 2: Install Required Software
1. **Nginx Web Server**:  
   Install Nginx on **VM 1 (Main Host)** by running the following command:
   ```bash
   sudo apt-get update
   sudo apt-get install nginx
2. **Node.js**:
   Install Node.js on all three VMs:
   ```bash
   sudo apt-get install nodejs
   sudo apt-get install npm
### Step 3: Deploy Web Application

#### Main Host (VM 1 - IP: 10.4.0.6)

1. **Copy Files**:
   - Place the entire contents of the **Main** folder into the following directory:
     ```
     /var/www/html/
     ```
   - **Note**: Do not copy the `server.js` file from the **Main** folder.

2. **Move Server File**:
   - Move the `server.js` file from the **Main** folder to the following directory:
     ```
     /home/azureuser/
     ```

3. **Run the Server**:
   - Execute the following command to start the server:
     ```bash
     node server.js
     ```
#### Host A (VM 2 - IP: 10.4.0.7)

1. **Move Server File**:
   - Place the `server.js` file from the **HostA** folder into the following directory:
     ```
     /home/azureuser/
     ```

2. **Run the Server**:
   - Execute the following command to start the server:
     ```bash
     node server.js
     ```

#### Host B (VM 3 - IP: 10.4.0.9)

1. **Move Server File**:
   - Place the `server.js` file from the **HostB** folder into the following directory:
     ```
     /home/azureuser/
     ```

2. **Run the Server**:
   - Execute the following command to start the server:
     ```bash
     node server.js
     ```
### Step 4: Configure Nginx on Main Host

### Prerequisites

- Ensure that Nginx is installed on your Main Host (VM 1).
- Ensure that you have the necessary permissions to edit the Nginx configuration files.

### Instructions

1. **Open the Nginx Configuration File**:
   - Access the Nginx configuration file located at:
     ```
     /etc/nginx/sites-enabled/default
     ```
   - Open the file using the following command:
     ```bash
     sudo nano /etc/nginx/sites-enabled/default
     ```

2. **Update the Configuration**:
   - Modify the configuration to point to the appropriate URLs (IP addresses or domain names). Below is a sample configuration:
     ```nginx
     server {
         listen 80;
         server_name 10.4.0.6;  # Replace with your Main Host's IP or domain name

         location / {
             proxy_pass http://localhost:3000;  # or the appropriate port running your server.js
         }
     }
     ```

3. **Save the Changes**:
   - After updating the configuration, save the changes in the nano editor by pressing `CTRL + O`, then press `Enter`. Exit the editor by pressing `CTRL + X`.

4. **Restart Nginx**:
   - Apply the changes by restarting Nginx with the following command:
     ```bash
     sudo systemctl restart nginx
     ```
### Step 5: Access the Application

Once Nginx is configured and running, you can access the web application by navigating to the Main Host's IP address or domain name in your web browser.

### Accessing the Application

- **URL Example**: http://10.4.0.6
- **Note**: Replace `10.4.0.6` with the actual IP address or domain name of your Main Host.

## Demonstration

During the demonstration, two embedded terminals will simulate the following scenarios:

- **Host A (Attacker)**:
- Initiating sniffing, spoofing, or Denial of Service (DoS) attacks from the attacker’s perspective.

- **Host B (Defender)**:
- Observing network defenses in action as the defender.

This setup provides insights into the security measures and response strategies used in real-world applications.

## Technology Stack

The following technologies and tools are utilized in this project:

- **Web Server**: Nginx

- **Backend**: Node.js

- **Frontend**: HTML, CSS, JavaScript (for displaying CIA Triad information)

- **Virtualization**: Azure Virtual Machines

- **Network Security Tools**: Sniffing, Spoofing, DoS (custom server scripts)

