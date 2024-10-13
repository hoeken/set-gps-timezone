const tzlookup = require('tz-lookup');
const { exec } = require('child_process');

module.exports = function(app) {
  let plugin = {};
  let unsubscribes = [];

  plugin.id = 'signalk-gps-timezone';
  plugin.name = 'GPS Timezone Plugin';
  plugin.description = 'Set the system timezone based on GPS coordinates';

  plugin.schema = {
    type: 'object',
    required: ['interval'],
    properties: {
      interval: {
        type: 'number',
        title: 'Update Interval (minutes)',
        default: 60
      },
      sudo: {
        type: 'boolean',
        title: 'Use sudo when setting the time',
        default: true
      }
    }
  };

  plugin.start = function(options, restartPlugin) {
    if (typeof options.interval === 'undefined' || !options.interval)
      options.interval = 60;
    const updateInterval = options.interval * 60 * 1000; // Convert minutes to milliseconds
    const useSudo = typeof options.sudo === 'undefined' || options.sudo;

    // linux only.
    if (process.platform == 'win32') {
      console.error("Set-system-time supports only linux-like os's")
    } else {
      const updateTimezone = () => {
        const position = app.getSelfPath('navigation.position');
        if (position && position.value) {
          const latitude = position.value.latitude;
          const longitude = position.value.longitude;
          //console.log(`GPS Position: Latitude=${latitude}, Longitude=${longitude}`);

          try {
            const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            //console.log('Current Timezone:', currentTimezone);

            const timezone = tzlookup(latitude, longitude);
            //console.log(`Detected timezone: ${timezone}`);
            
            if (currentTimezone !== timezone)
              setSystemTimezone(timezone, useSudo);
          } catch (error) {
            console.error('Error determining timezone:', error.message);
          }
        } else {
          console.log('No GPS position available.');
        }
      };

      // Initial update - wait 10s for gps to populate.
      setTimeout(updateTimezone, 10000);

      // Set interval for periodic updates
      const intervalId = setInterval(updateTimezone, updateInterval);
      unsubscribes.push(() => clearInterval(intervalId));
    }
  };

  plugin.stop = function() {
    unsubscribes.forEach(f => f());
    unsubscribes = [];
  };

  function setSystemTimezone(timezone, useSudo = true) {
    console.log(`Updating timezone to: ${timezone}`);
    
    //this is for our internal node.js timezone.
    process.env.TZ = timezone;
  
    const setTimezone = `timedatectl set-timezone ${timezone}`
    const command = useSudo
      ? `if sudo -n timedatectl &> /dev/null ; then sudo ${setTimezone} ; else exit 3 ; fi`
      : setTimezone

      exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error setting timezone: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`Timezone set to: ${timezone}`);
    });
  }

  return plugin;
};
