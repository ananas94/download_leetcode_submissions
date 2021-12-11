const { exec } = require("child_process");
const { writeFileSync } = require("fs");

let total = 19; 
let filter = [ {name:"wildcard-matching", timestamp:1635003565} ];
let only_accepted = true;

let {curl_request} = require("./secret.js")


function build_curl_request(string, offset, limit) {
	let offset_replaced = string.replace(/offset=\d+/, "offset="+offset);
	let limit_changed = string.replace(/limit=\d+/, "limit="+limit);
	return limit_changed;
}

let server_answers = {}
let limit = 20;  //not sure if server even pay attention to this parameter
let nice = 15;  // let's be nice to server and don't request everything in 1ms

function sleep(ms) {
  return new Promise((resolve) => {
	  setTimeout(resolve, ms);
	});
}

function make_curl_request(offset, limit ) {
	return new Promise( (resolve, reject) => {
		//TODO: likely it should be replaced with request/http/whatever/but not now
		exec(build_curl_request(curl_request, offset, limit), (error, stdout, stderr) => {
			if (error) {
				console.log(`error: ${error.message}`);
				return reject();
			}
			if (stderr) {
				console.log(`stderr: ${stderr}`);
			}
			resolve(stdout);
		});		
	});
}

async function main() {
	for (let i = 0; i<=total; i+=limit)
	{
		server_answers[i] =await make_curl_request(i, limit);
		await sleep(nice * 1000);		
	}

	let all = Object.keys(server_answers).reduce( (acc, elem) => { return acc.concat(JSON.parse(server_answers[elem]).submissions_dump); }, [] )
	console.log(all);

	all.forEach( e => console.log(`${e.timestamp} ${e.status_display}: ${e.title_slug}.${e.lang}`));
	all.reverse();
	let for_adding_to_git = all;

	if (only_accepted) { for_adding_to_git = for_adding_to_git.filter(elem => elem.status_display=='Accepted'); }
	console.log(for_adding_to_git);	
	for_adding_to_git.forEach( e =>  {
			let file_name = `${e.title_slug}.${e.lang}`; 
			writeFileSync(file_name, e.code);
			console.log(`git add ${file_name}`);
			console.log(`git commit -m "${e.status_display}: ${e.title}" --date ${e.timestamp} `);

		}
	);
		

}

main();
