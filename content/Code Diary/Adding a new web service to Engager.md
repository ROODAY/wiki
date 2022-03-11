## Install the service
Pretty straightforward, do what the install page for the service wants. Note that if you want to do localhost connection over docker, since Engager's running some services bare metal and some on docker, you may need to use the  `--network host` flag in the docker run command if the app needs to communicate with the baremetal stuff, like Plex or Ombi. Only use it if you need to however.

## Setup the DNS record on Cloudflare
Go [here](https://dash.cloudflare.com/98809caf7d48c435fa78742afaa38db1/rooday.com/dns) and add a new A record with the service name that points to Engager's IP. As of last update, it's `108.49.72.59`. But this will be on cloudflare anyways.

## Setup a basic nginx config
Inside `/etc/nginx/sites-available`, make a new file named `SERVICE_NAME.rooday.com` and populate the file with:
```
server {
    server_name SERVICE_NAME.rooday.com;
    location / {
        proxy_pass http://127.0.0.1:PORT;
    }

}
```
This assumes that the service is running localhost on some port, but that's a safe assumption here.

After creating that file, enable it by running `sudo ln -s /etc/nginx/sites-available/SERVICE_NAME.rooday.com /etc/nginx/sites-enabled/`, then run `sudo systemctl restart nginx` so it's live.

## Enable SSL through Let's Encrypt
Once the site is live and accessible (necessary for this step), run `sudo certbot --nginx -d SERVICE_NAME.rooday.com` and Let's Encrypt will do the rest (make sure to select the option to redirect http traffic to https).

## That's it!