var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Moniker = require('moniker');

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	//create a new user
	var user = addUser();
	//console.log("userIndex:" + userIndex);
	//console.log("jogador da vez: " + users[userIndex].name);
		
	//sends a welcome message to the new user
	//socket.emit sends a message only to this socket
	socket.emit("welcome", user);
	
	//print when a user connect to the chat
	console.log(user.name + " connected" + " id: " + socket.id + "\n");
	//console.log('total users: ' + users.length + "\n");

	socket.emit("startGame", users[0].name);
	updateCurrentLetter();
	updateWordsRemaining();
	updateInitialLetter(currentLetter);
	
	socket.on("checkWord", function(data){
		//console.log("word typed: " + data);
		//console.log("current letter: " + currentLetter);
		if(getFirstLetter(data) === currentLetter && inArray(data)){
			//console.log("letras iguais");
			user.points += 1;
			currentLetter = getLastLetter(data);
			updateLog("<i>" + user.name + "</i> digitou " + "<i>" + data + "</i>");
			removeWord(data);
			updateInitialLetter(currentLetter);
		}else{
			//console.log("letras diferentes ou palavra fora da array");
			updateLog("<i>" + user.name + "</i> errou");
			user.fails += 1;
		}
		updateUsers();
		//disableUser(socket);
		updateCurrentUser();
		
	});
	
	socket.on("pass", function(){
		//console.log("Jogador: <i>" + user.name + "</i> passou");
		updateLog("<i>" + user.name + "</i> passou");
		user.fails += 1;
		updateUsers();
		updateCurrentUser();
		//disableUser(socket);
	});
	
	socket.on("currentUser", function(){
		enableUser(socket);
	});
	
	socket.on("notCurrentUser", function(){
		disableUser(socket);
	});
	
	//event that print when a user disconnect
	socket.on('disconnect', function(){
		
		//remove the user from the users array
		removeUser(user);
		//console.log(user.name + ' disconnected');
		//console.log('total users: ' + users.length);
	});
	
});

var porta = process.env.PORT || 3000;
http.listen(porta, function(){
	console.log('listening on *:3000\n');
});

//animals array
var animals = ["abelha","águia","alce","andorinha","anta","antílope","aranha","avestruz",
			   "babuíno","baleia","barata","bisão","boi","borboleta","búfalo","burro","cabra",
			   "camelo","canguru","cachorro","caracol","caranguejo","carneiro","castor","cavalo",
			   "chimpanzé","cisne","cobra","coelho","coiote","coruja","corvo","corvo","crocodilo",
			   "dragão","dinossauro","elefante","enguia","esquilo","falcão","foca","formiga","frango",
			   "fuinha","furão","gaivota","ganso","garça","gato","gazela","girafa","golfinho","gorila",
			   "guaxinim","hamster","hiena","hipopótamo","iguana","jacaré","jaguar","javali","lagarta",
			   "lagarto","lagosta","leão","lebre","lemure","leopardo","lhama","libélula","lobo","lontra",
			   "lula","macaco","medusa","morsa","mosca","mosquito","mula","naja","ostra","ouriço","ovelha",
			   "panda","pantera","pato","pavão","pelicano","perú","pomba","ponei","porco","puma","raposa",
			   "ratazana","rato","rena","rinoceronte","salamandra","sapo","serpente","tartaruga","tatu",
			   "texugo","tigre","toupeira","tubarão","urso","veado","vespa"];

var currentLetter = "b";
//users array
var users = [];
var userIndex = 0;

			   
//select a random word from the animals array to be the first one
/*var firstWord = function(){
	var word = animals[Math.floor((Math.random() * animals.length) + 1)];
	console.log(word);
	io.sockets.emit("firstWord", word);
	getLastLetter(word);
	removeWord(word);
}*/

//remove the word from the animals array
var removeWord = function(word){
	for(var i=0; i<animals.length; i++){
		if(word == animals[i]){
			animals.splice(i, 1);
			updateWordsRemaining();
			return;
		}
	}
}

//gets the last letter from a word
var getLastLetter = function(word){
	var str = word.slice(word.length-1, word.length);
	//console.log("last letter of: " + word + " is: " + str);
	io.sockets.emit("updateCurrentLetter", str);
	return str;
}

//gets the first letter from a word
var getFirstLetter = function(word){
	var str = word.slice(0, 1);
	//console.log("first letter of: " + word + " is: " + str);
	return str;
}

//update the size of the animals array
var updateWordsRemaining = function(){
	io.sockets.emit("wordsRemaining", animals.length);
}

var updateInitialLetter = function(currentLetter){
	var counter = 0;
	for(var i=0; i<animals.length; i++){
		if(currentLetter === getFirstLetter(animals[i])){
			counter += 1;
		}
	}
	//io.sockets.emit("initialLetter", counter);
	console.log(counter);
	if(counter < 1){
		console.log("game over jogador: " + users[userIndex].name);
		io.sockets.emit("gameOver", getWinner());
	}else{
		io.sockets.emit("initialLetter", counter);
	}
	//console.log("Initial letter counter: " + counter);
	
}

var updateCurrentLetter = function(){
	io.sockets.emit("updateCurrentLetter", currentLetter);
}

var updateLog = function(string){
	io.sockets.emit("updateLog", string);
}

var startGame = function(){
	
}

var updateCurrentUser = function(){
	var currentUser = ''
	if(userIndex < users.length - 1){
		userIndex += 1;
	}else{
		userIndex = 0;
	}
	currentUser = users[userIndex].name;
	console.log("index: " + userIndex + " jogador da vez: " + currentUser);
	io.sockets.emit("updateCurrentUser", currentUser);
}

var getWinner = function(){
	var finalScore = [];
	finalScore = users.sort(function(a, b){return b.points - a.points});
	console.log(finalScore[0]);
	console.log("nome: " + finalScore[0].name + " pontos: " + finalScore[0].points);
	return finalScore[0];
}

/*var updateCurrentUserFix = function(){
	var currentUserFix = ''
	userIndex = 1;
	currentUserFix = users[userIndex].name;
	console.log("indexFix: " + userIndex + " jogador da vez FIX: " + currentUserFix);
	io.sockets.emit("updateCurrentUser", currentUserFix);
}*/

var disableUser = function(socket){
	socket.emit("disableUser");
}

var enableUser = function(socket){
	socket.emit("enableUser");
}

var inArray = function(word){
	if(animals.indexOf(word) != -1){
		//console.log("animals array tem: " + word);
		return true;
	}else{
		//console.log("animals array nao tem: " + word);
		return false;
	}
}
			   
var addUser = function(){
	var user = {
		//moniker.choose returns some random name
		name: Moniker.choose(),
		points: 0,
		fails: 0
	}
	//add the new user to the users array
	users.push(user);
	updateUsers();
	return user;
}

var updateUsers = function(){
	var str = '';
	for(var i=0; i<users.length; i++){
		var user = users[i];
		//str += user.name + user.points + user.fails;
		str += '<li class="w3-hover-pink">' + user.name + ' <small>(' + user.points + ' points ' + user.fails + ' errors)</small></li></br>';
	}
	io.sockets.emit("users", {users: str});
}

var removeUser = function(user){
	
	//console.log("removeUser: " + user.name);
	//BUG: quando o jogador index 0 sai do jogo
	//o jogador que ganha a vez de jogar
	//tera que jogar 2 vezes seguidas
	if(user.name == users[userIndex].name){
		updateCurrentUser();
	}
	for(var i=0; i<users.length; i++){
		if(user.name == users[i].name){
			//remove the user from the array
			users.splice(i, 1);
			updateUsers();
			return;
		}
	}
}