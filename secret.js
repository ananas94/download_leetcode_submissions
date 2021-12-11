
let curl_request = `curl 'https://leetcode.com/api/submissions/?offset=0&limit=20' -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0' -H 'Accept: */*'`

module.exports = { curl_request };
