const tzlookup = require('tz-lookup');
const { exec } = require('child_process');

module.exports = function(app) {
  let plugin = {};
  let unsubscribes = [];

  plugin.id = 'signalk-timezone-plugin';
  plugin.name = 'Signal K Timezone Plugin';
  plugin.description = 'Set the system timezone based on GPS coordinates';

  plugin.schema = {
    type: 'object',
    required: ['interval'],
    properties: {
      interval: {
        type: 'number',
        title: 'Update Interval (minutes)',
        default: 60
      }
    }
  };

  plugin.start = function(options, restartPlugin) {
    const updateInterval = options.interval * 60 * 1000; // Convert minutes to milliseconds

    const updateTimezone = () => {
      const position = app.getSelfPath('navigation.position');
      if (position && position.value) {
        const latitude = position.value.latitude;
        const longitude = position.value.longitude;
        console.log(`GPS Position: Latitude=${latitude}, Longitude=${longitude}`);

        try {
          const timezone = tzlookup(latitude, longitude);
          console.log(`Detected timezone: ${timezone}`);

          // Set the timezone using timedatectl
          setSystemTimezone(timezone);
        } catch (error) {
          console.error('Error determining timezone:', error.message);
        }
      } else {
        console.log('No GPS position available.');
      }
    };

    // Initial update
    updateTimezone();

    // Set interval for periodic updates
    const intervalId = setInterval(updateTimezone, updateInterval);
    unsubscribes.push(() => clearInterval(intervalId));
  };

  plugin.stop = function() {
    unsubscribes.forEach(f => f());
    unsubscribes = [];
  };

  function setSystemTimezone(timezone) {
    const command = `sudo timedatectl set-timezone ${timezone}`;
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
