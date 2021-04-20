/**
 * @param {string} callback - Called when the selected text is obtained
 */
function getSelectedIp(callback) {
  chrome.tabs.executeScript({
    code: "window.getSelection().toString();"
  }, (selection) => {
    if (selection && selection.length) {
      callback(selection[0]);
    } else {
      renderStatus(`
          <h1>No IP Selected</h1>
          <p>Highlight a valid IP and then click the icon again to query AbuseIPDB.  Happy hunting!</p>
      `);
    }
  });
}

/**
 * @param {string} searchAddress - IP or host being searched.
 * @param {function(string)} callback - Called when a location has been resolved
 * @param {function(string)} errorCallback - Called when the location is not found.
 *   The callback gets a string that describes the failure reason.
 */

function getIpLocation(searchAddress, callback, errorCallback) {
  let searchUrl = 'https://api.abuseipdb.com/api/v2/check';
  let x = new XMLHttpRequest();
if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(searchAddress)) {  
    x.open('GET', searchUrl+'?ipAddress='+searchAddress);
    x.setRequestHeader('Key', '<ABUSE API KEY>');
    x.setRequestHeader('verbose', 'yes');
    // x.setRequestHeader('Accept', 'application/json')
    x.responseType = 'json';
  } else if (/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi.test(searchAddress)) {
    renderStatus(`
          <h1>Not an IP Address</h1>
          <p>You highlighted a URL. The API can not search URLs, however you can try the link below for the report.</p>
          <a href="https://www.abuseipdb.com/check/${searchAddress}" target="_blank">Link to report</a>
      `);
  } 
  else {
      renderStatus(`
          <h1>No IP Selected</h1>
          <p>Highlight a valid IP and then click the icon again to query AbuseIPDB.  Happy hunting!</p>
      `);}
  
  x.onload = () => {
    const response = x.response;
    // const jsonResponse = JSON.parse(x.response)
    // const data = jsonResponse.data
    if (!response) {
      errorCallback('No response!');
      return;
    } else if (response.status === 'fail') {
      errorCallback('No response!');
      return;
    }
    callback(response);
  };
  x.onerror = () => {
    errorCallback('Network error.');
  };
  x.send();
}

function renderStatus(statusText) {
  const statusEl = document.getElementById('status');
  statusEl.innerHTML = statusText;
  statusEl.className += 'is-active';
}

document.addEventListener('DOMContentLoaded', () => {
  getSelectedIp((url) => {
    getIpLocation(url, (response) => {
      try{
        renderStatus(`
            <h1>Results For ${response.data.ipAddress}</h1>
            <table>
            <tr>
              <td><b>Public IP:</b> ${response.data.isPublic}</td>
            </tr>
            <tr>
              <td><b>ISP:</b> ${response.data.isp}</td>
            </tr>
            <tr>
              <td><b>Domain:</b> ${response.data.domain}</td>
            </tr>
            <tr>
              <td><b>Country Code:</b> ${response.data.countryCode}</td>
            </tr>
            <tr>
              <td><b>Total Reports:</b> <span style="color: red">${response.data.totalReports}</span></td>
            </tr>
            <tr>
              <td><b>Abuse Confidence Score:</b> <span style="color: red">${response.data.abuseConfidenceScore}%</span></td>
            </tr>
            <tr>
              <td><a href="https://www.abuseipdb.com/check/${response.data.ipAddress}" target="_blank">Link to report</a></td>
            </tr>
            </table>
        `);}
        catch(error){
          renderStatus(`
          <h1>Cannot locate host</h1>
          <p>Error when trying to retrieve data. Please try again.</p>
      `);}
    }, (errorMessage) => {
      renderStatus(`
          <h1>Cannot locate host</h1>
          <p>Error when trying to retrieve data. Please try again.</p>
      `);
    });
  });
});