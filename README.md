# set-gps-timezone

SignalK server plugin to set system timezone from GPS position.  It only works on Linux systems as it uses `timedatectl`.  Tested on Raspberry Pi.

# Configuration Interface

##  Use sudo when setting the time :

When this option is checked, **set-gps-timezone** plugin will try to use `sudo` to set the timezone.

It's required that sudo have a password-less access to the `timedatectl` command.

To give `sudo` a no password access only to the `timedatectl` command, you can add the following line to your sudoers file : 

```
pi ALL=(ALL) NOPASSWD: /usr/bin/timedatectl
```

--- *In this example, **pi** is the username that run the signalk server. Yours could be different.*