# Scheduled Backups on Ubuntu using Duplicacy and Azure

This page is a guide on how to backup a folder on an Ubuntu machine to a storage account on Azure, using [Duplicacy](https://github.com/gilbertchen/duplicacy). The data backed up to Azure will be encrypted with an RSA key, and the config encrypted with a password. The backups will be scheduled via cronjob, and will send an email to you on every run (this requires an SMTP server, [SendGrid](https://sendgrid.com/) is a decent option). This assumes you already have a machine setup.

## 1. Create a Storage Account
1. Go to the [Azure Portal](https://portal.azure.com/) and make a new storage account, doesn't matter the name/region/resource group etc. Feel free to use Azure's redundancy features for extra backup security (assuming you trust Azure to not go down, which is a fairly safe assumption).
2. Create a container within the storage account, and form the URL `azure://STORAGEACCOUNT/CONTAINER` and save this for later.
3. Get one of the access keys and save it for later.

## 2. Setup duplicacy
1. Grab the [latest release](https://github.com/gilbertchen/duplicacy/releases) of duplicacy, make it executable with `chmod +x` and then move it into `/usr/local/bin`.
2. Go into the folder you want to backup and run `duplicacy init -e -key public.pem repository_id storage_url`.
	1. `public.pem` can be any public RSA key.
	2. `repository_id` is just the name of the backup repository, choose whatever you like but remember it, as you'll need it if you ever want to pull down the backup onto another machine.
	3. `storage_url` is the URL formed in step 1.2.
	4. When you run this command, it will ask for a password because of the `-e` flag, this encrypts the config, so don't lose this password. It will also ask for the access key to the storage account.
3. Now you can run `duplicacy backup -stats` to do a backup. It will ask for the storage account access key and config password again. To prevent having to enter these every time, edit `.duplicacy/preferences` in the current folder and change the `"keys"` property to look like this:
```
"keys":  {
	"azure_key": "STORAGE ACCOUNT KEY HERE",
	"password": "CONFIG PASSWORD HERE"
},
```
4. Now you can run `duplicacy backup` or `duplicacy restore` from this machine without needing to enter the passwords all the time (note that the passwords are being stored here in plain text, so only do this if you trust no one will compromise the machine).

## 3. Setup duplicacy-util
duplicacy-util is another executable that helps schedule backups.
1. Similarly as before, grab the [latest release](https://github.com/jeffaco/duplicacy-util/releases) of duplicacy-util, run `chmod +x` on it, and move it to `/usr/local/bin`.
2. Make a `.duplicacy-util` folder somewhere, e.g. `~/.duplicacy-util`. Go in there and make 2 files: `duplicacy-util.yaml` and `repository_id.yaml` where `repository_id` is the name you used in step 2.2. This name doesn't really matter but it helps to keep things consistent.
3. In `duplicacy-util.yaml`, enter the following:
```
notifications:
  onStart: []
  onSkip: ['email']
  onSuccess: ['email']
  onFailure: ['email']

email:
  fromAddress: "Duplicacy Backup <duplicacy@domain.com>"
  toAddress: "Firstname Lastname <someemail@domain.com>"
  serverHostname: smtp.sendgrid.net
  serverPort: 587
  authUsername: apikey
  authPassword: XXX
```
This assumes you're using SendGrid, change the email config options as necessary.
4. In `repository_id.yaml`, enter the following:
```
repository: /path/to/folder

storage:
  - name: default
    threads: 1

prune:
  - storage: default
    keep: "0:365 30:180 7:30 1:7"
    threads: 1

check:
  - storage: default
```
`repository` is the folder you initialized duplicacy in, from step 2.2. Read the [duplicacy-util docs](https://github.com/jeffaco/duplicacy-util) on the different settings here. Here's what the current `keep` settings mean:
```
1:7       # Keep a revision per (1) day for revisions older than 7 days
7:30      # Keep a revision every 7 days for revisions older than 30 days
30:180    # Keep a revision every 30 days for revisions older than 180 days
0:360     # Keep no revisions older than 360 days
```
You can increase the thread count if you have them to improve performance.
5. Finally you need to edit your crontab to run duplicacy-util on some schedule. Run `sudo crontab -e` to edit the root crontab and add `0 5 * * * /usr/local/bin/duplicacy-util -sd /path/to/.duplicacy-util -f repository_id -a -m -q`. This will run the job at 5 AM every day, running backup, pruning, and validation of data, with no output to logs, and will send an email.