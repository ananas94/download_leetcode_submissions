const { exec,execSync } = require("child_process");
const { writeFileSync } = require("fs");

let filter_problems = [ {title_slug:"wildcard-matching", timestamp:1635003565} ];
let only_accepted = true;
let filter_newer_than; // = 1637417431;

let {curl_request} = require("./secret.js")


function build_curl_request(string, offset, limit) {
	let offset_replaced = string.replace(/offset=\d+/, "offset="+offset);
	let limit_changed = offset_replaced.replace(/limit=\d+/, "limit="+limit);
	return limit_changed;
}

let server_answers = {}  //global - I do this in REPL, so I need some data source alive after main()
let all = [];

let limit = 20;  //not sure if server even pay attention to this parameter
let nice = 5;  // let's be nice to server and don't request everything in 1ms

function sleep(ms) {
  return new Promise((resolve) => {
	  setTimeout(resolve, ms);
	});
}

function make_curl_request(offset, limit ) {
	return new Promise( (resolve, reject) => {
		//TODO: likely it should be replaced with request/http/whatever/but not now
		//TODO: execSync!
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
	let i = 0;
	let has_next = true;
	while (has_next) 
	{
		server_answers[i] =await make_curl_request(i, limit);
		let server_answer = JSON.parse(server_answers[i]);
		has_next = server_answer.has_next;


		all = all.concat(server_answer.submissions_dump);
		if (filter_newer_than && server_answer.submissions_dump[server_answer.submissions_dump.length -1].timestamp < filter_newer_than) has_next = false;


		if (has_next) await sleep(nice * 1000);		
		i+=limit;
	}
	

	console.log("________________________all_____________");
	all.forEach( e => console.log(`${e.timestamp} ${e.status_display}: ${e.title_slug}.${e.lang}`));

	all.reverse();

	let for_adding_to_git = all;
	if (only_accepted) { for_adding_to_git = for_adding_to_git.filter(elem => elem.status_display=='Accepted'); }
	if (filter_problems.length) { for_adding_to_git = for_adding_to_git.filter( elem => !filter_problems.find( f => f.title_slug == elem.title_slug && f.timestamp == elem.timestamp )) }
	if (filter_newer_than) { for_adding_to_git = for_adding_to_git.filter(elem => elem.timestamp >= filter_newer_than) };

	console.log("________________________for git_____________");
	for_adding_to_git.forEach( e => console.log(`${e.timestamp} ${e.status_display}: ${e.title_slug}.${e.lang}`));

	for_adding_to_git.forEach( e =>  {
			let file_name = `${e.title_slug}.${e.lang}`; 
			console.log(file_name);	
			writeFileSync(file_name, e.code);
			execSync(`git add ${file_name}`);
			execSync(`GIT_AUTHOR_DATE=${e.timestamp} GIT_COMMITTER_DATE=${e.timestamp} git commit -m "${e.title}: ${e.status_display}" --allow-empty`); // allow-empty require explanation. sometimes FOR SOME REASON  I send same solution twice...
		}
	);
	
	console.log(`next filter_newer_than ${ for_adding_to_git[for_adding_to_git.length-1].timestamp}`);
		

}

main();

