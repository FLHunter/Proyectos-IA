var w = 800;
var h = 400;
var jugador;
var fondo;

var bala, balaD = false, nave;
var bala2 = false;
var balaD2 = false;

var saltoY;
var saltoX;
var menu;

var velBala;
var velBala2;
var despBala;
var despBala2;
var estatusAireY;
var estatusAireX;

var nnNetwork, nnEntrenamiento, nnSalida, datosEntrenamiento = [];
var modoAuto = false, eCompleto = false;

var juego = new Phaser.Game(w, h, Phaser.CANVAS, '', {preload: preload, create: create, update: update, render: render});

function preload(){
	juego.load.image('fondo', 'assets/game/fondo.jpg');
	juego.load.spritesheet('mono', 'assets/sprites/altair.png', 32, 48);
	juego.load.image('nave', 'assets/game/ufo.png');
	juego.load.image('bala', 'assets/sprites/purple_ball.png', 6, 6);
	juego.load.image('menu', 'assets/game/menu.png');
}

function create(){
	juego.physics.startSystem(Phaser.Physics.ARCADE);
	juego.time.desiredFps = 30;
	
	fondo = juego.add.tileSprite(0, 0, w, h, 'fondo');
	nave = juego.add.sprite(w-100, h-70, 'nave');
	nave = juego.add.sprite(w-790, h-390, 'nave');
	bala = juego.add.sprite(w-100, h, 'bala');
	bala2 = juego.add.sprite(0, h-400, 'bala');
	jugador = juego.add.sprite(0, h, 'mono');
	
	juego.physics.enable(jugador);
	jugador.body.collideWorldBounds = true;
	jugador.body.gravity.x = -800;
	jugador.body.gravity.y = 800;
	var corre = jugador.animations.add('corre', [8, 9, 10, 11]);
	jugador.animations.play('corre', 10, true);
	
	juego.physics.enable(bala);
	bala.body.collideWorldBounds = true;

	juego.physics.enable(bala2);
	bala2.body.collideWorldBounds = true;
	
	pausaL = juego.add.text(w - 100, 20, 'Pausa', { font: '20px Arial', fill: '#f0f' });
	pausaL.inputEnabled = true;
	pausaL.events.onInputUp.add(pausa, self);
	juego.input.onDown.add(mPausa, self);
	
	saltoY = juego.input.keyboard.addKey(Phaser.Keyboard.UP);
	saltoX = juego.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
	
	nnNetwork = new synaptic.Architect.Perceptron(4, 8, 6, 2);
	nnEntrenamiento = new synaptic.Trainer(nnNetwork);
}

function enRedNeural(){
	nnEntrenamiento.train(datosEntrenamiento, {rate: 0.0003, iterations: 10000, shuffle: true});
}

function datosDeEntrenamiento(param_entrada){
	console.log("Entrada", param_entrada[0] + " " + param_entrada[1] + " " + param_entrada[2] + " " + param_entrada[3]);
	nnSalida = nnNetwork.activate(param_entrada);
	var aireY = Math.round(nnSalida[0]*100);
	var aireX = Math.round(nnSalida[1]*100);
	console.log("Valor ", "En aireY: " + aireY + " En X: " + aireX);
	var datos = [];
	datos[0] = aireY;
	datos[1] = aireX;

	return datos;
}

function pausa(){
	resetVariables();
	resetVariablesDos();
	juego.paused = true;
	menu = juego.add.sprite(w/2, h/2, 'menu');
	menu.anchor.setTo(0.5, 0.5);
}

function mPausa(event){
	if(juego.paused){
		var menu_x1 = w/2 - 270/2, menu_x2 = w/2 + 270/2, menu_y1 = h/2 - 180/2, menu_y2 = h/2 + 180/2;
		var mouse_x = event.x, mouse_y = event.y;
		
		if(mouse_x > menu_x1 && mouse_x < menu_x2 && mouse_y > menu_y1 && mouse_y < menu_y2){
			if(mouse_x >= menu_x1 && mouse_x <= menu_x2 && mouse_y >= menu_y1 && mouse_y <= menu_y1 + 90){
				eCompleto = false;
				datosEntrenamiento = [];
				modoAuto = false;
			} else if (mouse_x >= menu_x1 && mouse_x <= menu_x2 && mouse_y >= menu_y1 + 90 && mouse_y <= menu_y2){
				if(!eCompleto){
					console.log("","Entrenamiento " + datosEntrenamiento.length + " valores");
					enRedNeural();
					eCompleto = true;
				}
				modoAuto = true;
			}
			resetVariables();
			resetVariablesDos();
			menu.destroy();
			juego.paused = false;
		}
	}
}

function resetVariables(){
	jugador.body.velocity.x = 0;
	jugador.body.velocity.y = 0;
	bala.body.velocity.x = 0;
	bala.position.x = w - 100;
	balaD = false;
}

function resetVariablesDos(){
	bala2.body.velocity.y = 0;
    bala2.position.y = h-400;
    balaD2 = false;
}

function saltarY(){
	jugador.body.velocity.y = -320;
}

function saltarX(){
	jugador.body.velocity.x = 320;
}

function update(){
	fondo.tilePosition.x -= 1;
	juego.physics.arcade.collide(bala, jugador, colisionH, null, this);
	juego.physics.arcade.collide(bala2, jugador, colisionH, null, this);

	estatusAireY = 0;
	estatusAireX = 0;
	
	if(!jugador.body.onFloor()){
		estatusAireY = 1;
	}

	if(!jugador.body.onWall()){
		estatusAireX = 1;
	}
	
	despBala = Math.floor(jugador.position.x - bala.position.x);
	despBala2 = Math.floor( jugador.position.y - bala2.position.y);
	
	if(modoAuto == false && saltoY.isDown && jugador.body.onFloor()){
		saltarY();
	}

	if(modoAuto==false && saltoX.isDown && jugador.body.onWall() ){
        saltarX();
    }

	if (modoAuto == true) {
		var accion = datosDeEntrenamiento([despBala, velBala, despBala2, velBala2])
		if(bala.position.x > 0 && jugador.body.onFloor() && accion[0] > 60){
			saltarY();
		}
		if(bala2.position.y < 400 && jugador.body.onWall() && accion[1] > 60){
			saltarX();
		}
	}

	if(balaD == false){
		disparo();
	}

	if(balaD2 == false){
		disparo2();
	}
	
	if(bala.position.x <= 0){
		resetVariables();
	}

	if(bala2.position.y >= 380){
		resetVariablesDos();
	}
	
	if(modoAuto == false && bala.position.x > 0){
		datosEntrenamiento.push({'input':[despBala, velBala, despBala2, velBala2], 'output':[estatusAireY, estatusAireX]});
		console.log(despBala, + " " + velBala, + " " + despBala2, + " " + velBala2, + " " + estatusAireY + " " + estatusAireX);
	}		
}

function disparo(){
	velBala = -1 * velRandom(200,600);
	bala.body.velocity.y = 0;
	bala.body.velocity.x = velBala;
	balaD = true;
}

function disparo2(){
	velBala2 = 1 * velRandom(200,450);
    bala2.body.velocity.x = 0;
    bala2.body.velocity.y = velBala2;
    balaD2 = true;
}

function colisionH(){
	pausa();
}

function velRandom(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function render(){
	
}

