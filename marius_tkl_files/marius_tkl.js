/////////////////////////////////////////////////////////////////
//    S�nid�mi � T�lvugraf�k
//     S�nir notkun � lyklabor�satbur�um til a� hreyfa spa�a
//
//    Tómas Kristinn, febrúar 2022
/////////////////////////////////////////////////////////////////
var canvas;
var gl;
var xFaersla = 0;
var yFaersla = 0.4;
var jumped = true; 
var stefna = 1; 
var map; 
var vertices; 
var verts; 
var vertices_haegri;
var vertices_vinstri;
var speed = 0;
var iniTime = Date.now(); 
var midja = vec2(0,-0.8);
const jumpHeight = 0.05
var hopp = 0.0;
gravity = 0.0015; 
var ovinasveifla = 0; 
var coinsHover = []; 
var coinsSpawnTime = []; 
var coinsFaerslur = [];
var coinsLifetime = [];
var coinsFjoldi = 1; 
var stig = 0;
var stigaPlass; 
var mostRecentCoinTime = Date.now(); 
var win = false; 
var loss = false; 
var song = new Audio('marius_tkl_files/song.wav')
var onObst = false; 
var obstSveifla = 0.0;
var obstSize = 1.0;

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.1, 0.1, 0.1, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    stigaPlass = document.getElementById("stigafjoldi");
    vertices_vinstri = [
        vec2( 0.04, -0.7 ),
        vec2( 0.04, -0.8 ),
        vec2(  -0.08, -0.8 ),
        vec2( 0.04, -0.9 ),
    ];
    vertices_haegri = [
        vec2( -0.04, -0.7 ),
        vec2( -0.04, -0.8 ),
        vec2(  0.08, -0.8 ),
        vec2( -0.04, -0.9 ),
    ];
    gullmoli_verts = [
        vec2(  0.02, -0.035 ),
        vec2(  0.02,  0.035 ),
        vec2(  -0.02, 0.035 ),
        vec2(  -0.02, -0.035 ),
    ];
    ovinur_verts = [
        vec2(  0.05, -0.9 ),
        vec2(  0.05,  -0.80 ),
        vec2(  -0.05, -0.80 ),
        vec2(  -0.05, -0.9 ),
    ];
    strik_verts = [
        vec2(  -0.97, 0.96 ),
        vec2(  -0.97,  0.86 ),
        vec2(  -0.95, 0.86 ),
        vec2(  -0.95, 0.96 ),
    ];
    ground_verts = [
        vec2(  -1.0, -1.0),
        vec2(  -1.0, -0.9),
        vec2(  1.0, -0.9),
        vec2(  1.0, -1.0),
    ];
    obst_verts = [
        vec2(  -0.2, -0.235),
        vec2(  -0.2, -0.165),
        vec2(  0.2, -0.165),
        vec2(  0.2, -0.235),
    ];
   
    coinsSpawnTime.push(Date.now())
    coinsHover.push(0.0);
    coinsFaerslur.push(vec2(Math.random()*1.9-0.95,Math.random()-0.8));
    coinsLifetime.push(Math.random()*4.0+5.0);
    vertices = vertices_haegri.slice();

    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 4*4*2*6, gl.DYNAMIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
   
    map = {}; // You could also use an array
    onkeydown = onkeyup = function(e){
        e = e || event; // to deal with IE
        map[e.keyCode] = e.type == 'keydown';
        if(!win && !loss){
            song.play();
        }
      
    }

    locJump = gl.getUniformLocation( program, "jump" );
    locLitur = gl.getUniformLocation( program, "litur" );
    locErCoin = gl.getUniformLocation( program, "erCoin" );
    locErOvinur = gl.getUniformLocation( program, "erOvinur" );
    locTimi = gl.getUniformLocation( program, "timi" );
    locRandomCoin = gl.getUniformLocation( program, "randomCoin" );
    locBackground = gl.getUniformLocation( program, "backgroundElement" );

    render();
}

function keyDown(){
    
    if (map[37]){ // vinstri ör
        stefna = -1; 
        speed -= 0.001; 
        vertices = vertices_vinstri.slice();
    }	     
            
    if (map[39]){ // hægri ör
        stefna  = 1; 
        speed += 0.001; 
        vertices = vertices_haegri.slice();
       
    }	   
           
    if (map[38]){ // upp ör
        if (!jumped){
            jumped = true; 
            onObst = false; 
            hopp = jumpHeight;
            audio = new Audio('marius_tkl_files/hopp.wav');
            audio.play();
        } 
    }	
     xFaersla+=speed;
      speed*=0.94;
            

    
    verts = vertices.slice();

        for(i=0; i<4; i++) {
            verts[i] = add(vertices[i],vec2(xFaersla,0));
           
        }
  
 
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(verts));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4*2*4, flatten(gullmoli_verts));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4*2*4*2, flatten(ovinur_verts));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4*2*4*3, flatten(strik_verts));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4*2*4*4, flatten(ground_verts));
    gl.bufferSubData(gl.ARRAY_BUFFER, 4*2*4*5, flatten(obst_verts));
    
}
function handleJump(){

    obstSveifla = Math.sin((Date.now()-iniTime)/1200)/4;
    obstSize = Math.sin((Date.now()-iniTime)/500)/2+1.0;
 
    yFaersla +=hopp; 
    //ofan á obst árekstur
    if(yFaersla+verts[3][1]>=obst_verts[0][1]&&yFaersla+verts[3][1]<=obst_verts[1][1] && verts[3][0]>=(obst_verts[1][0]+ obstSveifla)*obstSize  && verts[3][0]<=(obst_verts[2][0] + obstSveifla)*obstSize && hopp<=0.0){
        yFaersla = obst_verts[1][1]+0.9; 
        onObst = true; 
        jumped = false; 
    }
    //undir obst árekstur
    if(yFaersla+verts[0][1]>=obst_verts[0][1]&&yFaersla+verts[0][1]<=obst_verts[1][1] && verts[0][0]>=(obst_verts[1][0]+obstSveifla)*obstSize  && verts[0][0]<=(obst_verts[2][0]+ obstSveifla)*obstSize  && hopp>=0.0){
        hopp = -0.01; 
        onObst=false; 
        jumped = true; 
        audio = new Audio('marius_tkl_files/rebound.wav');
            audio.play();
    }
    if(yFaersla+verts[2][1]>=obst_verts[0][1]&&yFaersla+verts[2][1]<=obst_verts[1][1] && verts[2][0]>=(obst_verts[1][0]+obstSveifla)*obstSize  && verts[2][0]<=(obst_verts[2][0]+ obstSveifla)*obstSize){
        if(hopp>=0.0){
            hopp = -0.01; 
        }
        else if(jumped){
            if(stefna==1){
                vertices = vertices_vinstri.slice();
            }
            else{
                vertices = vertices_haegri.slice();
            }
            stefna = -stefna; 
            speed =-speed; 
        }
        jumped = true; 
        onObst=false; 
        audio = new Audio('marius_tkl_files/rebound.wav');
            audio.play();
    }
    else if (yFaersla<=-0.0){
        yFaersla = 0.0; 
        jumped = false; 
    }
    else if ((verts[3][1]+yFaersla)>-0.9 && !onObst){
        hopp -= gravity;
        jumped = true; 
    }
    else{
        onObst=false; 
    }
}

function handleCoins(){
    for(i = 0; i<coinsFjoldi;i++){
        coinsHover[i] = Math.sin((Date.now()-coinsSpawnTime[i])/1000)*0.1;
    }

    if((Date.now()-mostRecentCoinTime)/1000 >= 2.5 ){
        coinsFaerslur.push(vec2(Math.random()*1.9-0.95,Math.random()*1.7-0.8))
        coinsSpawnTime.push(Date.now());
        coinsFjoldi++;
        coinsHover.push(0);
        coinsLifetime.push(Math.random()*4.0+5.0);
        mostRecentCoinTime = Date.now();
    }
    
    for(i = 0; i<coinsFjoldi;i++){
        if((Date.now()-coinsSpawnTime[i])/1000 >= coinsLifetime[i]){
            coinsSpawnTime[i] = coinsSpawnTime[coinsFjoldi-1];
            coinsHover[i] = coinsHover[coinsFjoldi-1];
            coinsLifetime[i] = coinsLifetime[coinsFjoldi-1];
            coinsFaerslur[i] = coinsFaerslur[coinsFjoldi-1];
            coinsFjoldi--; 
            coinsFaerslur.pop()
            coinsLifetime.pop();
            coinsHover.pop();
            coinsSpawnTime.pop();
        }
    }
    if (win){
        throw "You win... I guess"
    }
    
    for(i = 0; i<coinsFjoldi;i++){
        if(length(add(add(midja,negate(add(coinsFaerslur[i],vec2(0,coinsHover[i])))),vec2(xFaersla,yFaersla)))<0.1){
        
            coinsLifetime[i] = 0;
            stig++; 
            stigaPlass.innerHTML = "Stig:" + stig; 
            audio = new Audio('marius_tkl_files/coin.wav');
            audio.play();
            if (stig == 10){
                win = true; 
               
            }
        }
    }
    if(win){
        audio = new Audio('marius_tkl_files/win.wav');
        song.pause();
        audio.play();
    }

}
function handleEnemy(){
    ovinasveifla = Math.sin((Date.now()-iniTime)/800)*1.0 + (Math.random()-0.5)/10;
    if(loss){
        throw "LOSER!!!"
    }
     if(length(add(add(midja,negate(vec2(ovinasveifla,-0.85))),vec2(xFaersla,yFaersla)))<0.09){
            loss = true; 
            audio = new Audio('marius_tkl_files/death.wav');
            song.pause();
            audio.play();
    }
    
}
function handleWallJump(){
    for(i = 0; i<=3;i++){
        if(verts[i][0]>=1.0 ||verts[i][0]<=-1.0){
            if(Math.abs(stefna-xFaersla)>1.0){
                xFaersla= -stefna* 0.96; 
            }
            else{
                xFaersla= stefna* 0.92; 
                if(stefna==1){
                    vertices = vertices_vinstri.slice();
                }
                else{
                    vertices = vertices_haegri.slice();
                }
                stefna = -stefna; 
            }
            audio = new Audio('marius_tkl_files/rebound.wav');
            audio.play();
            speed = -speed;  
        }
    }
}


function render() {
    
    keyDown();
    handleJump();
    handleCoins();
    handleEnemy();
    handleWallJump();

    gl.clear( gl.COLOR_BUFFER_BIT );

    gl.uniform1f( locBackground, false);
    gl.uniform1i( locErCoin, false);
    gl.uniform1i( locErOvinur, false);
    gl.uniform1f( locJump, yFaersla);
    gl.uniform4fv( locLitur, vec4(1.0, 0.2, 0.2, 1.0));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 3);
    gl.uniform4fv( locLitur, vec4(0.2, 0.43, 1.0, 1.0));
    gl.drawArrays( gl.TRIANGLE_FAN, 1, 3);
    gl.uniform1i( locErCoin, true);
    gl.uniform1f( locJump, 1.0);
    gl.uniform4fv( locLitur, vec4(1.0, .85, 0.0, 1.0));
    for(i = 0; i<coinsFjoldi;i++){
        gl.uniform2fv(locRandomCoin, coinsFaerslur[i])
        gl.uniform1f( locTimi, coinsHover[i]);
        gl.drawArrays( gl.TRIANGLE_FAN, 4, 4);
    }
    gl.uniform1i( locErCoin, false);
    gl.uniform1i( locErOvinur, true);
    gl.uniform1f( locTimi, ovinasveifla);
    gl.uniform4fv( locLitur, vec4(Math.random(), Math.random(), Math.random(), 1.0));
    gl.drawArrays( gl.TRIANGLE_FAN, 8, 4);
    gl.uniform1f( locBackground, true);
    gl.uniform1i( locErOvinur, false);
    
    gl.uniform4fv( locLitur, vec4(1.0, 1.0, 1.0, 1.0));

    for(i = 0; i < stig; i++){
        if(i>=5){
            gl.uniform1f( locTimi, i+1);
        }
        else{
            gl.uniform1f( locTimi, i);
        }
        gl.drawArrays( gl.TRIANGLE_FAN, 12, 4);
    }
    gl.uniform4fv( locLitur, vec4(0.15, 0.4, 0.15, 1.0));
    gl.uniform1f( locTimi, 0.0);
    gl.drawArrays( gl.TRIANGLE_FAN, 16, 4);
    gl.uniform1f( locTimi, obstSveifla*30.0);
    gl.uniform1f( locJump, obstSize);
    gl.drawArrays( gl.TRIANGLE_FAN, 20, 4);
    
    window.requestAnimFrame(render); 
}