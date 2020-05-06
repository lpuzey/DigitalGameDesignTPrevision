/*
game.js for Perlenspiel 3.3.x
Last revision: 2018-10-14 (BM)
*/

"use strict";

/* jshint browser : true, devel : true, esversion : 5, freeze : true */
/* globals PS : true */

//TODO: Make Corora virus spawn and hurt the player
//TODO: Make levels that progress in difficulty

var G = ( function () {
	//The size of the entire grid
	var GRID_X = 20;
	var GRID_Y = 20;

	//Max poistion that the cart or TP can move to
	var MAX_X = 18;
	var MAX_Y = 19;

	//The planes that each sprite exists on
	var PLANE_CART = 2;
	var PLANE_TP = 1;

	//array of toilet paper
	var TP = [];

	//Cart sprite
	var sprite_cart; // sprite identifier for the cart


	var cart_x = 10; // x-pos of cart
	var cart_y = 18; // y-pos of cart

	//Different Cart Images
	var loader;
	var image_initCart;


	//The number of toilet paper in the cart
	var numInCart = 0;

	//The number of toilet paper the player has gotten into the car
	var numInCar = 0;

	//number of lives the player has
	var lives = 3;

	//cause a game over if you loose all 3 lives
	var gameover = false;

	//Possible Colors for the cart
	//To be taken out later
	var COLORS = [
		"cartInit.png","cart1.png","cart2.png","cart3.png","cart4.png"
	];

	// *BM* This is the cart's collider
	// It removes any TP sprite that OVERLAPS it.

	var onCollide = function ( s1, p1, s2, p2, type ) {
		// Ignore TPs that hit a full cart for now
			if (type === PS.SPRITE_OVERLAP) {
				var i = TP.indexOf(s2); // find the colliding sprite in TP array
				if (i >= 0) {
					PS.spriteShow(TP[i], false); // simply hide the TP sprite! prevents further collisions
					numInCart += 1; // add TP to cart
					if (numInCart < 5) {
						//PS.spriteSolidColor(sprite_cart, COLORS[numInCart]);
						PS.spriteShow(sprite_cart, false);

						PS.imageLoad(COLORS[numInCart], loader);

						PS.audioPlay("fx_swoosh");
					}
					else{
						// Player cart is too full
						//PS.debug(numInCart)
							lives -= 1;
							numInCart = 0;
							//PS.spriteSolidColor(sprite_cart, COLORS[numInCart]);
							PS.spriteShow(sprite_cart, false);


							PS.imageLoad(COLORS[numInCart], loader);

							PS.statusText("LIFE LOST!");
							PS.gridColor(PS.COLOR_RED);
							PS.audioPlay("fx_blast3");
							PS.gridFade(10);
							PS.gridColor(PS.COLOR_WHITE);


						//A gameover has been triggered
							if (lives < 0) {
								gameover = true;
								PS.spriteShow(sprite_cart, false);

								for (var i = 0; i < TP.length; i++) {
									PS.spriteShow(TP[i], false);
								}

								PS.color(PS.ALL,PS.ALL, PS.COLOR_RED);
								PS.border (PS.ALL,PS.ALL, 0);

								DB.send();

								PS.statusText("GAME OVER!");
								PS.audioPlay("fx_wilhelm");

							}

					}
					//PS.debug( "Collided! Cart contains " + numInCart + "\n" );
				}
			}

	}
		;

	//Creates a random gray  floor
	var draw_map = function () {
		var x, y;

		for ( y = 0; y < GRID_Y; y += 1 ) {
			for ( x = 0; x < GRID_X; x += 1 ) {
				if(x > 4){
					if((x == 5)||(x==12)||(x==19)||(y==0)||(y==5)||(y==10)||(y==15)){
						PS.color( x, y, PS.COLOR_BLACK);

					}
					else{
						PS.color( x, y, PS.COLOR_CYAN);

					}

				}
				else{
					PS.color( x, y, PS.COLOR_GREEN);

				}

			}
		}
		PS.color(0,19, PS.COLOR_RED);
		PS.color(1,19, PS.COLOR_RED);
		PS.color(0,18, PS.COLOR_RED);
		PS.color(1,18, PS.COLOR_RED);
	};

	//Makes a toilet paper sprite and puts in an array of toilet paper
	var makeTP = function () {
		if(gameover == true){
			return;
		}

		//creates a random spot for the TP to spawn
		var tpX = PS.random( 19 );

		//Makes sure that the TP doesn't spawn near the car
		if ( tpX < 16 ) {
			tpX += 4;
		}

		var tp = PS.spriteSolid( 1, 1 ); // Create 1x1 solid sprite, save its ID
		PS.spritePlane( tp, PLANE_TP ); // Set plane to 1 (above floor)
		PS.spriteSolidColor( tp, PS.COLOR_WHITE );
		PS.spriteMove( tp, tpX, 0 );
		TP.push( tp );
	};

	//Function that moves the cart
	var moveCart = function ( dx ) {		// First move the cart

		if(gameover == true){
			return;
		}
		var nx = cart_x + dx;

		// Only move cart if within bounds

		if ( ( nx >= 2 ) && ( nx < MAX_X ) ) {
			cart_x = nx;
			if ( cart_x == 2 ) {
				PS.statusText( "L:" + lives + " " + "Press SPACE to empty your shopping cart" );
			}
			else {
				PS.statusText( "L:" + lives + " " + "Catch toilet paper in cart. Max 4." );
			}
			PS.spriteMove( sprite_cart, cart_x, cart_y ); // this may cause a collision!
		}
	};

	// Timer that drops toilet paper and removes it when it hits ground
	// Any TP that collides with moving cart is hidden, and cannot collide again
	var moveTP = function () {
		if(gameover == true){
			return;
		}

		var i, len, tp, pos, x, y;

		i = 0;
		len = TP.length;
		while ( i < len ) {
			tp = TP[ i ]; // get a TP
			pos = PS.spriteMove( tp ); // only need to call this once
			x = pos.x;
			y = pos.y;
			if ( y <= MAX_Y ) {
				PS.spriteMove( tp, x, y + 1 );
				i += 1; // point to next sprite
			}
			else {
				PS.spriteDelete( tp ); // nuke the sprite
				TP.splice( i, 1 ); // remove its id from TP array
				len -= 1; // reduce size of TP array
			}
		}
	};

	//Function that removes toilet paper from the shopping cart and puts it in the car
	var remCart = function () {
		if ( ( cart_x == 2 ) && ( numInCart >= 1 ) ) {
			numInCart -= 1;
			numInCar += 1;
			drawTpInCar();

			DB.send();

			PS.audioPlay("fx_bloop");
			//PS.spriteSolidColor( sprite_cart, COLORS[ numInCart ] );
			PS.spriteShow(sprite_cart, false);


			PS.imageLoad(COLORS[numInCart], loader);

			//PS.debug( numInCart + "\n" );
		}
	}

	//Draws the TP in the car
	var row = 0;
	var drawTpInCar = function(){
		var mod = numInCar%19;
		var column = 18 - mod;

		if(row == 1){
			column = 17 - mod;
		}
		PS.color(row, column, PS.COLOR_WHITE);
		PS.border( row, column, 1 );
		//PS.debug("carNum:"+ numInCar);
		if(column == 0){
			row += 1;
		}
		if(numInCar >= 36){
			win();
		}
	}

	//Function called when you win the game
	var win = function(){
		gameover = true;
		PS.spriteShow(sprite_cart, false);
		//PS.spriteShow(sprite_car,false)

		for (var i = 0; i < TP.length; i++) {
			PS.spriteShow(TP[i], false);
		}

		PS.color(PS.ALL,PS.ALL, PS.COLOR_GREEN);
		PS.border (PS.ALL,PS.ALL, 0);

		DB.send();

		PS.statusText("YOU WIN!");
		PS.audioPlay("fx_tada");
	}
	;

	return {
		init : function () {
			"use strict"; // Do not remove this directive!
			var complete = function ( user ) {
				//PS.statusText( "Hi, " + user + "! Touch the number." );

				PS.timerStart( 60, makeTP );
				PS.timerStart( 6, moveTP );

			};


			PS.gridSize( GRID_X, GRID_Y ); // init grid
			PS.border( PS.ALL, PS.ALL, 0 ); // no borders
			PS.statusText( "Use arrow/WASD keys to move your cart" );

			//gameover
			PS.audioLoad("fx_wilhelm");
			//gamewin
			PS.audioLoad("fx_tada");
			//live lost
			PS.audioLoad("fx_blast3");
			//empty cart
			PS.audioLoad("fx_bloop");
			//cart filled
			PS.audioLoad("fx_swoosh");


			draw_map(); // draws walls


			loader = function ( data ) {
				image_initCart = data; // save image ID

				sprite_cart = PS.spriteImage( image_initCart );


				PS.spritePlane( sprite_cart, PLANE_CART);
				PS.spriteMove( sprite_cart, cart_x, cart_y );
				PS.spriteCollide( sprite_cart, onCollide ); // *BM* Only the cart needs a collider function


			};

			PS.imageLoad("cartInit.png", loader);



			// change the call parameter to false to disable DB calls
			DB.active( true);
			DB.init( "HoardTp", complete ); // Initialize the API

		},
		keyDown : function ( key ) {
			switch ( key ) {
				case PS.KEY_ARROW_LEFT:
				case 97:
				case 65: {
					moveCart( -1 ); // tell cart to move left
					break;
				}
				case PS.KEY_ARROW_RIGHT:
				case 100:
				case 68: {
					moveCart( 1 ); // tell cart to move right
					break;
				}
				case 32: {
					remCart();
					break;
				}
			}
		}
	};
}() );

PS.init = G.init;
PS.keyDown = G.keyDown;
