SSH is great, but having to type in the password all the time is annoying. It also breaks this wonderful plugin: [obsidian-git](https://github.com/denolehov/obsidian-git).

In order to prevent having to type in the password all the time, we have to add the SSH Key to the SSH Agent, which will prompt for the password once and then never again. Here's how to do so in PowerShell

``` powershell
# Set the SSH Agent to start with Windows
Set-Service ssh-agent -StartupType Automatic

# Start it manually just in case it's not already running
Start-Service ssh-agent

# Add your SSH Key, this will prompt for the password
ssh-add C:\path\to\your\ssh\key\id_rsa

# Validate that it actually added it
ssh-add -l
```

Now you won't need to type your password anymore! Try it out by ssh'ing into some remote machine.

However, this still isn't enough for git. I'm not entirely sure at this moment which of the following three steps are needed, but I'll order them in terms how important I currently thing they are.

First, set a new system environment variable: `GIT_SSH=C:\Windows\System32\OpenSSH\ssh.exe`.

Now, pretty much do the same thing but through git itself: `git config --global core.sshCommand C:/Windows/System32/OpenSSH/ssh.exe`.

Finally, for good measure, tell git to store your credentials: `git config --global credential.helper store`.

And bingo! Now you won't need to type your password for git either, and [obsidian-git](https://github.com/denolehov/obsidian-git) will work properly to boot!