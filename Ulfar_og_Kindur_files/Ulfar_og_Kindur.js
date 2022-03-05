/////////////////////////////////////////////////////////////////
//    Verkefni 2 í Tölvugrafík
//     Kindur og Úlfar simulation
//
//    Tómas Kristinn, mars 2022
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var NumVertices  = 24;

var points = [];
var colors = [];
var kindur = [];
var ulfar = [];

var kindaFjoldi = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var ulfaFjoldi = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

var vBuffer;
var vPosition;
var simulationGOING = true; 

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;
var changingWorld = false; 
var readyForChange = false; 
var wolfLife = 20; 

var zDist = -3.0;
var eyesep = 0.2;
var startTime = Date.now()
var song = new Audio('Ulfar_og_Kindur_files/song.wav')

var proLoc;
var mvLoc;
var locPos;
var heimur; 
var frames = 0;
var timeStepCount = 0; 
var tempKindur = []; 
var tempUlfar = []; 
var mealsNeeded = 3; 
var animalPercent = 0.9;



var division = 20;
var simSpeed = 30; 
var birthSpeed = 20; 
var animalNum = Math.floor((division*division*division)/100); 

var graphScalar1 = 1/division;
var graphScalar2 = 10;

// the 8 vertices of the cube
var v = [
    vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ),
    vec3(  0.5,  0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 )
];

makeCube()


var lines = [ v[0], v[1], v[1], v[2], v[2], v[3], v[3], v[0],
              v[4], v[5], v[5], v[6], v[6], v[7], v[7], v[4],
              v[0], v[4], v[1], v[5], v[2], v[6], v[3], v[7]
            ];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.1, 0.1, 0.1, 1.0  );
    
    //gl.colorMask(true, true, true, false);
    gl.enable(gl.DEPTH_TEST);

    /* gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquation(gl.FUNC_ADD); */
    
    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, (24+36)*12, gl.STATIC_DRAW );

    // gl.bufferData( gl.ARRAY_BUFFER, flatten(lineVline), gl.STATIC_DRAW );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(lines));
    gl.bufferSubData(gl.ARRAY_BUFFER, NumVertices*12, flatten(points));

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "wireColor" );
    
    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );

    var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));



    locPos = gl.getUniformLocation( program, "move" );
    
    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (origX - e.offsetX) ) % 360;
            spinX = ( spinX + (e.offsetY - origY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    
    // Event listener for keyboard
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:	// upp ör
                zDist += 0.1;
                break;
            case 40:	// niður ör
                zDist -= 0.1;
                break;
         }
     }  );  


    /*  let tempDivision = prompt("Please enter the size of the simulation:", "20");
     if (tempDivision == null || tempDivision == "") {
         //text = "User cancelled the prompt.";
     } else {
        division = parseInt(tempDivision); 
        
     } */
   
    
    document.getElementById("btnNewSheep").disabled = true; 
    document.getElementById("btnNewWolf").disabled = true; 

    

    document.getElementById("sizeSlider").onchange = function(event) {
        division = Math.round(event.target.value);
        animalNum = Math.floor((division*division*division)/100); 
        graphScalar1 = 1/division;
        
    };
   
    document.getElementById("speedSlider").onchange = function(event) {
        simSpeed = Math.floor(event.target.value);
    };
    document.getElementById("animalSlider").onchange = function(event) {
        animalPercent = (event.target.value);
    };
    document.getElementById("hungrySlider").onchange = function(event) {
        mealsNeeded = Math.floor(event.target.value);
        timeStepCount = 0;
    };
    document.getElementById("birthTimeSlider").onchange = function(event) {
        birthSpeed = Math.floor(event.target.value);
        timeStepCount = 0;
    };
    document.getElementById("wolfLifeSlider").onchange = function(event) {
        wolfLife = Math.floor(event.target.value);
        timeStepCount = 0;
    };
    document.getElementById("volumeSlider").onchange = function(event) {
        song.volume = event.target.value;
        //song.play();
    };
    document.getElementById("btnNewWolf").onclick = function(){
        timeStepCount = 0; 
        
        ulfar.push(new Ulfur(Math.floor(Math.random()*division),Math.floor(Math.random()*division),Math.floor(Math.random()*division)));
        simulationGOING = true; 
        
    };
    document.getElementById("btnNewSheep").onclick = function(){
        timeStepCount = 0;
        kindur.push(new Kind(Math.floor(Math.random()*division),Math.floor(Math.random()*division),Math.floor(Math.random()*division)));
    };
   
    document.getElementById("btnStartSim").onclick = function(){

        document.getElementById("btnNewSheep").disabled = false; 
        document.getElementById("btnNewWolf").disabled = false; 
        document.getElementById("btnStartSim").disabled = true; 
        document.getElementById("sizeSlider").disabled = true; 
        document.getElementById("animalSlider").disabled = true; 

        heimur = new grid(); 
        for(let i = 0; i < animalNum; i++){
            var rand = Math.random()
            if(rand <animalPercent){
                kindur.push(new Kind(Math.floor(Math.random()*division),Math.floor(Math.random()*division),Math.floor(Math.random()*division)))
            }
            else{
                ulfar.push(new Ulfur(Math.floor(Math.random()*division),Math.floor(Math.random()*division),Math.floor(Math.random()*division)))
            }
        } 


        render(); 
        song.play();
        song.addEventListener("ended", function() { 
            song.play();
          }, true);
        
    };
    
    
}

function makeCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        
    }
}

class Kind {
    constructor(x, y, z) {
      this.x = x; 
      this.y = y; 
      this.z = z; 

      this.moveX = x; 
      this.moveY = y; 
      this.moveZ = z; 
      this.GoingThroughWorld = false; 
      this.moveVec = [];
      this.alive = true; 

      this.rand = Math.random();
      
      this.stepsSinceBirth = 0;   
      this.movementVec =[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
      
    }
    
    moveSheep(){
        var movementOptions = [];

        if(heimur.find(this.x, this.y, this.z) == 2){
            var ulfur = heimur.getCube(this.x, this.y, this.z).getUlfur();
            ulfur.killedSheep();
            heimur.set(this.x,this.y,this.z, 0);
            //heimur.set(this.moveX,this.moveY,this.moveZ, 0);
           /*  var myId = 0; 
            kindur.forEach(kind => {
                if(kind != this){
                    myId++
                }else{
                    console.log("I died, my id is" + myId)
                }
                
            }); */

            kindur = arrayRemove(kindur, this);
            //console.log("i really fucking died");
           
            
            
            this.alive = false; 
            return false; 
        }


        heimur.set(this.x ,this.y, this.z, 0);

        


        for(let i = 0; i < 6; i++){
            if(heimur.find((this.x+this.movementVec[i][0]+division)%division,(this.y+this.movementVec[i][1]+division)%division,(this.z+this.movementVec[i][2]+division)%division) == 0){
                    movementOptions.push(i); 
            }
            else if(heimur.find((this.x+this.movementVec[i][0]+division)%division,(this.y+this.movementVec[i][1]+division)%division,(this.z+this.movementVec[i][2]+division)%division) == 2){
                //console.log("i kind of died");
                
                var ulfur = heimur.getCube((this.x+this.movementVec[i][0]+division)%division,(this.y+this.movementVec[i][1]+division)%division,(this.z+this.movementVec[i][2]+division)%division).getUlfur();
                ulfur.killedSheep();
                heimur.set(this.x,this.y,this.z, 0);
                kindur = arrayRemove(kindur, this); 
                this.alive = false;  
                /* movementOptions.clear;
                movementOptions.push(i);
                var myId = 0; 
                kindur.forEach(kind => {
                        if(kind != this){
                            myId++
                        }else{
                            console.log("I should have died, my id is: " + myId)
                        }
                        
                    }); */
                
            }
           
        }
        
        if(movementOptions.length != 0 &&this.alive){
            var move = movementOptions[Math.floor(Math.random()*movementOptions.length)];
            
            this.x = (this.x+this.movementVec[move][0]+division)%division;
            this.y = (this.y+this.movementVec[move][1]+division)%division; 
            this.z = (this.z+this.movementVec[move][2]+division)%division; 
          
            heimur.set(this.x,this.y,this.z, 1);
            movementOptions.clear;
        }
    }

    giveBirth(){
        this.stepsSinceBirth++; 
        if (this.stepsSinceBirth >= Math.floor(this.rand*birthSpeed) + birthSpeed){
            //console.log("i waited " + this.stepsSinceBirth + " so I gave birth to a beautiful child <3, also my random value is " + this.rand)
            this.stepsSinceBirth = 0;
            var movementOptions = [];
            for(let i = 0; i < 6; i++){
                if(heimur.find((this.x+this.movementVec[i][0]+division)%division,(this.y+this.movementVec[i][1]+division)%division,(this.z+this.movementVec[i][2]+division)%division) == 0){
                        movementOptions.push(i); 
                }
            }
            if(movementOptions.length != 0){
                var move = movementOptions[Math.floor(Math.random()*movementOptions.length)];

                kindur.push(new Kind((this.x+this.movementVec[move][0]+division)%division, (this.y+this.movementVec[move][1]+division)%division, (this.z+this.movementVec[move][2]+division)%division));
                movementOptions.clear;
            }
        }
    }
}
function arrayRemove(arr, value) { 
    
    return arr.filter(function(ele){ 
        return ele != value; 
    });
}


class grid{
    constructor(){
        this.world=[];
        for(let i = 0; i<division; i++){
            this.world.push([]);
            for(let j = 0; j<division; j++){
                this.world[i].push([]);
                for(let k = 0; k<division; k++){
                    this.world[i][j].push(new gridCube());
                }
            }
        }
    }

    set(i,j,k, tegund){
        //console.log(i + ", " + j+ ", " +k+ ", " +tegund);
        /* console.log(i + " - "  + j  + " - "  +k + " - "  +tegund )
        console.log(this.world[i][j][k]) */
        if (i !== undefined && j !== undefined && k !== undefined && tegund !== undefined) {
            this.world[i][j][k].setTegund(tegund);
        }
       
        //console.log(i + ", " + j+ ", " +k+ ", " +tegund);
    }

    find(i,j,k){
        return this.world[i][j][k].getTegund();
    }
    getCube(i,j,k){
        return this.world[i][j][k]; 
    }
    setCube(i,j,k, ulfur){
        this.world[i][j][k].setUlfur(ulfur)
    }
}


class gridCube{
    constructor(){
     this.tegund = 0; 
     this.Ulfur; 
    }
    getUlfur(){
        return this.Ulfur; 
    }
    getTegund(t){
        return this.tegund; 
    }
    setTegund(t){
        this.tegund = t; 
    }
    setUlfur(ulfur){
        this.Ulfur = ulfur; 
    }
}

class Ulfur{
    constructor(x, y, z) {
        this.x = x; 
        this.y = y; 
        this.z = z; 
        this.moveX = x; 
        this.moveY = y; 
        this.moveZ = z; 
        this.GoingThroughWorld = false; 
        this.moveVec = [];
        this.iAmSpeeding = false; 

        this.sheepEaten = 1;
        this.movementVec = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[2,0,0],[-2,0,0],[0,2,0],[0,-2,0],[0,0,2],[0,0,-2],[3,0,0],[-3,0,0],[0,3,0],[0,-3,0],[0,0,3],[0,0,-3]];
        this.movesSinceKill=0; 
        this.alive = true; 
        this.lastMove; 
        
    }
    moveWolf(){
        heimur.set(this.x,this.y,this.z, 0);
        heimur.setCube(this.x,this.y,this.z,null);
        //console.log("i am now at " + this.x +", " + this.y +", " + this.z +", ");
     
        this.movesSinceKill++; 
        this.iAmSpeeding = false; 
        if(this.movesSinceKill >= wolfLife ){
            this.sheepEaten--; 
            
            if(this.sheepEaten<0){
                heimur.set(this.x,this.y,this.z, 0);
                heimur.setCube(this.x,this.y,this.z, null)
                this.alive=false; 
                ulfar = arrayRemove(ulfar, this);
                /* var audio = new Audio('Ulfar_og_Kindur_files/wolfDeath.wav');
                audio.play(); */
                       
                //console.log("wolf starved at " + this.x +", " + this.y +", " + this.z +", ");
             
            }
            else{
                
                this.movesSinceKill = 0; 
            }
            
        }
        if(this.alive){
            var movementOptions = [];
            heimur.set(this.x,this.y,this.z, 0);
            heimur.setCube(this.x,this.y,this.z,null)
          
            var tempLastMove = -1; 
            if (!this.iAmSpeeding){
                for(let i = 6; i < 18; i++){
                    if(heimur.find((this.x+this.movementVec[i][0]+division)%division,(this.y+this.movementVec[i][1]+division)%division,(this.z+this.movementVec[i][2]+division)%division) == 1){
                        movementOptions.push((i+1)%6); 
                        tempLastMove = -2;
                        //console.log("i smell something");
                        
                    }
                }
                if(movementOptions.length == 0){
                    for(let i = 0; i < 6; i++){
                        if(heimur.find((this.x+this.movementVec[i][0]+division)%division,(this.y+this.movementVec[i][1]+division)%division,(this.z+this.movementVec[i][2]+division)%division) == 0){
                            movementOptions.push(i); 
                            tempLastMove = -1; 
                        } 
                    }
                }
                if(movementOptions.length != 0){
                    var move = movementOptions[Math.floor(Math.random()*movementOptions.length)];
                    
                    //lætur úlfinn fara í sömu átt ef hann fann þef af kind fyrir einu movei
                     if(tempLastMove ==-2){
                        //this.lastMove = move; 
                        this.iAmSpeeding = true; 
                        
                    }
                    /*else{
                        this.lastMove = -1;
                    }
                     
                    if (this.iAmSpeeding){
                        move = this.lastMove;  
                        console.log("my last move was " + this.lastMove);
                       
                    }
                     */
                   
                    //this.lastMove = tempLastMove; 
                    
                    
                
                    
                    this.x = (this.x+this.movementVec[move][0]+division)%division;
                    this.y = (this.y+this.movementVec[move][1]+division)%division; 
                    this.z = (this.z+this.movementVec[move][2]+division)%division; 
                    if(this.iAmSpeeding){
                        this.x = (this.x+this.movementVec[move][0]+division)%division;
                        this.y = (this.y+this.movementVec[move][1]+division)%division; 
                        this.z = (this.z+this.movementVec[move][2]+division)%division; 

                        //console.log("i sped");
                    }
                    
                    heimur.set(this.x,this.y,this.z, 2);
                    heimur.setCube(this.x,this.y,this.z, this);
                    movementOptions.clear;
                }

            }
            /* else{
                move = this.lastMove; 
                console.log("i smelled a sheep last time so my move is " + move);
                this.x = (this.x+this.movementVec[move][0]+division)%division;
                this.y = (this.y+this.movementVec[move][1]+division)%division; 
                this.z = (this.z+this.movementVec[move][2]+division)%division; 
                
                heimur.set(this.x,this.y,this.z, 2);
                heimur.setCube(this.x,this.y,this.z, this);
                movementOptions.clear;
            } */
            
        }
        
    }
  
    killedSheep(){
        this.movesSinceKill = 0; 
        this.sheepEaten++; 
        
        if (this.sheepEaten>=mealsNeeded){
            //console.log("I have eaten " + this.sheepEaten +" sheep, so I gave birth to a child");
            this.giveBirth();
            this.sheepEaten = 0; 
        }
          
    }
    giveBirth(){
        
        this.sheepEaten=0;
        var movementOptions = [];
        for(let i = 0; i < 6; i++){
            if(heimur.find((this.x+this.movementVec[i][0]+division)%division,(this.y+this.movementVec[i][1]+division)%division,(this.z+this.movementVec[i][2]+division)%division) == 0){
                    movementOptions.push(i); 
            }
        }
        if(movementOptions.length != 0){
            var move = movementOptions[Math.floor(Math.random()*movementOptions.length)];

            ulfar.push(new Ulfur((this.x+this.movementVec[move][0]+division)%division, (this.y+this.movementVec[move][1]+division)%division, (this.z+this.movementVec[move][2]+division)%division));
            movementOptions.clear;
        }
    }
    getAlive(){
        return this.alive; 
    }
  
 
}


function render()
{
    
    frames = frames%(simSpeed); 
    
   
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 

    var mv = mat4();
    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, zDist+2), vec3(0.0, 1.0, 0.0) );                
    var mv = mult( mv, mult( rotateX(spinX), rotateY(spinY) ) );
    mv = mult( mv, rotateY((((Date.now()-startTime)/1000))*5))

    var a = 0; 
   

   //draws grid
   gl.uniform4fv( colorLoc, vec4(1.0, 0.0, 0.0, 1.0));
    gl.uniform4fv( colorLoc, vec4(240/255, 233/255, 209/255, 1.0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.LINES, 0, NumVertices );
 
    //draws graph
    kindaFjoldi.push(kindur.length);
    kindaFjoldi = kindaFjoldi.slice(1,kindaFjoldi.length);
    
    gl.uniform4fv( colorLoc, vec4(240/255, 233/255, 209/255, 1.0));
    for(let i = 0; i<kindaFjoldi.length; i++){
        var mv2 = mat4();
        var lineThickness = 0.01; 
        mv2 = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, zDist+4.0), vec3(0.0, 1.0, 1.0) );
        mv2 = mult( mv2, translate( 1.333-i/kindaFjoldi.length,-1.3333,0));  
        
        mv2 = mult( mv2, scalem( lineThickness, lineThickness*Math.log(1+ graphScalar1 * kindaFjoldi[i])*graphScalar2, 0 ));
        mv2 = mult( mv2, translate( 0,0.5,0));       
        gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
        gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );
    } 

  

    ulfaFjoldi.push(ulfar.length);
    ulfaFjoldi = ulfaFjoldi.slice(1,ulfaFjoldi.length);
    
    gl.uniform4fv( colorLoc, vec4(95/255, 85/255, 83/255, 1.0));
    for(let i = 0; i<ulfaFjoldi.length; i++){
        var mv2 = mat4();
        var lineThickness = 0.01; 
        mv2 = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, zDist+4.0), vec3(0.0, 1.0, 1.0) );
        mv2 = mult( mv2, translate( 1.333-i/ulfaFjoldi.length,-1.3333+lineThickness*Math.log(1+ graphScalar1 * kindaFjoldi[i])*graphScalar2,0)); 
          
        mv2 = mult( mv2, scalem( lineThickness, lineThickness*Math.log(1+ graphScalar1 * ulfaFjoldi[i])*graphScalar2, 0 ));
        mv2 = mult( mv2, translate( 0,0.5,0));       
        gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
        gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );
    }  

   /*  gl.uniform4fv( colorLoc, vec4(1.0, 0, 0, 1.0));
    var mv2 = mat4();
    mv2 = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, zDist+4.0), vec3(0.0, 1.0, 1.0) );
    mv2 = mult( mv2, scalem( 10, 10, 0 ));
    mv2 = mult( mv2, translate( 0,0,-5));       
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv2));
    gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );
 */
  
   
    gl.uniform4fv( colorLoc, vec4(240/255, 233/255, 209/255, 1.0));   
    kindur.forEach(kind => {
        
        if(frames==0) {
            
            kind.GoingThroughWorld = false;
            kind.moveVec = [];

            kind.moveX = kind.x; 
            kind.moveY = kind.y;
            kind.moveZ = kind.z; 
        
            if(simulationGOING){
                kind.moveSheep(); 
                kind.giveBirth();
            }
            
            document.getElementById("fjöldiKinda").innerHTML = kindur.length; 
            document.getElementById("timeStepCount").innerHTML =timeStepCount; 
            if(kind.moveX == division-1 && kind.x == 0 || kind.moveX == 0 && kind.x == division-1 || kind.moveY == division-1 && kind.y == 0 || kind.moveY == 0 && kind.y == division-1 || kind.moveZ == division-1 && kind.z == 0 || kind.moveZ == 0 && kind.z == division-1 ){
                kind.GoingThroughWorld = true; 
                kind.moveVec = [(kind.moveX - kind.x)/(division-1), (kind.moveY - kind.y)/(division-1), (kind.moveZ - kind.z)/(division-1)];
                //console.log("i go");
            }
        }
        //console.log((kind.moveX -((kind.moveX-kind.x)/(division)*frames)/division)/division-0.5 +0.5/division);
        if(!kind.GoingThroughWorld){
            mvt = mult( mv, translate((kind.moveX - (((kind.moveX-kind.x)/simSpeed)*frames))/division-0.5 +0.5/division,(kind.moveY - (((kind.moveY-kind.y)/simSpeed)*frames))/division-0.5 +0.5/division,(kind.moveZ - (((kind.moveZ-kind.z)/simSpeed)*frames))/division-0.5 +0.5/division));
            mvt = mult( mvt, scalem( 1/division, 1/division, 1/division ));
            gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
            gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );
        }
        else if(kind.GoingThroughWorld){


           
            //fara út úr heimi
            mvt = mult( mv, translate(
                kind.moveX/division-0.5 +(1-Math.abs(kind.moveVec[0]))/(2*division) + (Math.abs(kind.moveVec[0]) + kind.moveVec[0])/(2*division), 
                kind.moveY/division-0.5 +(1-Math.abs(kind.moveVec[1]))/(2*division) + (Math.abs(kind.moveVec[1]) + kind.moveVec[1])/(2*division), 
                kind.moveZ/division-0.5 +(1-Math.abs(kind.moveVec[2]))/(2*division) + (Math.abs(kind.moveVec[2]) + kind.moveVec[2])/(2*division)
                ));
            mvt = mult( mvt, scalem( 1/division -Math.abs((kind.moveVec[0]*frames)/simSpeed)/division, 1/division-Math.abs((kind.moveVec[1]*frames)/simSpeed)/division, 1/division -Math.abs((kind.moveVec[2]*frames)/simSpeed)/division));
            mvt = mult( mvt, translate(-kind.moveVec[0]/2,-kind.moveVec[1]/2,-kind.moveVec[2]/2));

            gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
            gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );  
    
            //fara inn í heim
            mvt = mult( mv, translate(
                kind.x/division-0.5 +(1-Math.abs(kind.moveVec[0]))/(2*division) + (Math.abs(kind.moveVec[0]) + kind.moveVec[0])/(2*division) - kind.moveVec[0]/division, 
                kind.y/division-0.5 +(1-Math.abs(kind.moveVec[1]))/(2*division) + (Math.abs(kind.moveVec[1]) + kind.moveVec[1])/(2*division) - kind.moveVec[1]/division, 
                kind.z/division-0.5 +(1-Math.abs(kind.moveVec[2]))/(2*division) + (Math.abs(kind.moveVec[2]) + kind.moveVec[2])/(2*division) - kind.moveVec[2]/division
                ));
            
            mvt = mult( mvt, scalem(
                (Math.abs(kind.moveVec[0]) -1)/division + Math.abs((kind.moveVec[0]*frames)/simSpeed)/division,
                (Math.abs(kind.moveVec[1]) -1)/division + Math.abs((kind.moveVec[1]*frames)/simSpeed/division),
                (Math.abs(kind.moveVec[2]) -1)/division + Math.abs((kind.moveVec[2]*frames)/simSpeed/division)
                )); 
            mvt = mult( mvt, translate(kind.moveVec[0]/2, kind.moveVec[1]/2, kind.moveVec[2]/2));

            gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
            gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );
            
            

            
     
        }


       
    });
   
   
    //draws wolf
    
    ulfar.forEach(ulfur => {
        gl.uniform4fv( colorLoc, vec4(95/255, 85/255, 83/255, 1.0));
        
        if(ulfur.sheepEaten<=0){
            gl.uniform4fv( colorLoc, vec4(95/255 + (((255-95)/wolfLife)*ulfur.movesSinceKill)/255, 85/255, 83/255, 1.0));
            //console.log("I'm starving, I've only eaten " + ulfur.sheepEaten + " sheep, and I've walked " + ulfur.movesSinceKill + " since my last meal")  
        }
        
        if(frames==0) {
          
            ulfur.iAmSpeeding = false; 
            ulfur.GoingThroughWorld = false;
            ulfur.moveVec = [];
            ulfur.moveX = ulfur.x; 
            ulfur.moveY = ulfur.y;
            ulfur.moveZ = ulfur.z; 
            //console.log("i am at " + ulfur.x + ", " + ulfur.y + ", " + ulfur.z + ", ");
            ulfur.moveWolf(); 
            
            document.getElementById("fjöldiUlfa").innerHTML = ulfar.length; 
            /* if(ulfur.lastMove != -1 && ulfur.lastMove != -2 && ulfur.lastMove != undefined){
                
                console.log("i smell sheep at " + ulfur.x + ", " + ulfur.y + ", " + ulfur.z + ", also my last move was: " + ulfur.lastMove);
                ulfur.iAmSpeeding = true;  
                ulfur.moveWolf(); 
                console.log("i smelled  sheep, now I'm at " + ulfur.x + ", " + ulfur.y + ", " + ulfur.z + ", ");
                
                
            } */
            if(ulfur.moveX == division-1 && ulfur.x == 0 || ulfur.moveX == 0 && ulfur.x == division-1 || ulfur.moveY == division-1 && ulfur.y == 0 || ulfur.moveY == 0 && ulfur.y == division-1 || ulfur.moveZ == division-1 && ulfur.z == 0 || ulfur.moveZ == 0 && ulfur.z == division-1 ){
                ulfur.GoingThroughWorld = true; 
                ulfur.moveVec = [(ulfur.moveX - ulfur.x)/(division-1), (ulfur.moveY - ulfur.y)/(division-1), (ulfur.moveZ - ulfur.z)/(division-1)];
                /* console.log(ulfur.x + ", " + ulfur.moveX + ", " +ulfur.y + ", " +ulfur.moveY + ", " +ulfur.z + ", " +ulfur.moveZ);
                console.log(ulfur.moveVec); */
            }
            if(ulfur.iAmSpeeding){
                ulfur.moveVec = [(ulfur.moveX - ulfur.x)/(division-2), (ulfur.moveY - ulfur.y)/(division-2), (ulfur.moveZ - ulfur.z)/(division-2)];
                //console.log(ulfur.x + ", " + ulfur.moveX + ", " +ulfur.y + ", " +ulfur.moveY + ", " +ulfur.z + ", " +ulfur.moveZ);
                
                if(Math.abs(ulfur.moveVec[0])==1 || Math.abs(ulfur.moveVec[1])==1 || Math.abs(ulfur.moveVec[2])==1){
                    ulfur.moveVec = [ulfur.moveVec[0]*2, ulfur.moveVec[1]*2, ulfur.moveVec[2]*2]
                    //console.log(ulfur.moveVec); 
                    //console.log("wtfff næææææsssss");
                }else{
                    ulfur.moveVec = [];
                }
            }
        }
        if(Math.abs(ulfur.moveVec[0]) == 2 || Math.abs(ulfur.moveVec[1]) == 2 || Math.abs(ulfur.moveVec[2]) == 2){
            //console.log("i zoomin");
            //gl.uniform4fv( colorLoc, vec4(88/255, 59/255, 51/255, 1.0));
            if(ulfur.moveX == division-2 && ulfur.x == 0 || ulfur.moveX == 1 && ulfur.x == division-1 || ulfur.moveY == division-2 && ulfur.y == 0 || ulfur.moveY == 1 && ulfur.y == division-1 || ulfur.moveZ == division-2 && ulfur.z == 0 || ulfur.moveZ == 1 && ulfur.z == division-1 ){
                //console.log("i went from further")
                
                
                if(frames<(simSpeed/2)){
                    mvt = mult( mv, translate(
                        (ulfur.moveX-ulfur.moveVec[0]/2 + (((ulfur.moveVec[0]/2)/simSpeed)*frames*2))/division-0.5 +0.5/division,
                        (ulfur.moveY-ulfur.moveVec[1]/2 + (((ulfur.moveVec[1]/2)/simSpeed)*frames*2))/division-0.5 +0.5/division,
                        (ulfur.moveZ-ulfur.moveVec[2]/2 + (((ulfur.moveVec[2]/2)/simSpeed)*frames*2))/division-0.5 +0.5/division));
                    mvt = mult( mvt, scalem( 1/division, 1/division, 1/division ));
                    gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
                    gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );

                }else{
                    //fara út úr heimi
                    //smá vitlaust
                    mvt = mult( mv, translate(
                        (ulfur.moveX+ulfur.moveVec[0]/2)/division-0.5 +(1-Math.abs(ulfur.moveVec[0]/2))/(2*division) + (Math.abs(ulfur.moveVec[0]/2) + ulfur.moveVec[0]/2)/(2*division), 
                        (ulfur.moveY+ulfur.moveVec[1]/2)/division-0.5 +(1-Math.abs(ulfur.moveVec[1]/2))/(2*division) + (Math.abs(ulfur.moveVec[1]/2) + ulfur.moveVec[1]/2)/(2*division), 
                        (ulfur.moveZ+ulfur.moveVec[2]/2)/division-0.5 +(1-Math.abs(ulfur.moveVec[2]/2))/(2*division) + (Math.abs(ulfur.moveVec[2]/2) + ulfur.moveVec[2]/2)/(2*division)
                        ));
                    mvt = mult( mvt, scalem( 
                        1/division -Math.abs((ulfur.moveVec[0]/2*(frames-simSpeed/2)*2)/simSpeed)/division, 
                        1/division -Math.abs((ulfur.moveVec[1]/2*(frames-simSpeed/2)*2)/simSpeed)/division, 
                        1/division -Math.abs((ulfur.moveVec[2]/2*(frames-simSpeed/2)*2)/simSpeed)/division
                    ));
                    mvt = mult( mvt, translate(-ulfur.moveVec[0]/4,-ulfur.moveVec[1]/4,-ulfur.moveVec[2]/4));
        
                    gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
                    gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );  

                    //fara inn í heim
                    mvt = mult( mv, translate(
                        ulfur.x/division-0.5 +(1-Math.abs(ulfur.moveVec[0]/2))/(2*division) + (Math.abs(ulfur.moveVec[0]/2) + ulfur.moveVec[0]/2)/(2*division) - ulfur.moveVec[0]/2/division, 
                        ulfur.y/division-0.5 +(1-Math.abs(ulfur.moveVec[1]/2))/(2*division) + (Math.abs(ulfur.moveVec[1]/2) + ulfur.moveVec[1]/2)/(2*division) - ulfur.moveVec[1]/2/division, 
                        ulfur.z/division-0.5 +(1-Math.abs(ulfur.moveVec[2]/2))/(2*division) + (Math.abs(ulfur.moveVec[2]/2) + ulfur.moveVec[2]/2)/(2*division) - ulfur.moveVec[2]/2/division
                        ));
                    
                    mvt = mult( mvt, scalem(
                        (Math.abs(ulfur.moveVec[0]/2) -1)/division + Math.abs((ulfur.moveVec[0]/2*(frames-simSpeed/2)*2)/simSpeed)/division,
                        (Math.abs(ulfur.moveVec[1]/2) -1)/division + Math.abs((ulfur.moveVec[1]/2*(frames-simSpeed/2)*2)/simSpeed/division),
                        (Math.abs(ulfur.moveVec[2]/2) -1)/division + Math.abs((ulfur.moveVec[2]/2*(frames-simSpeed/2)*2)/simSpeed/division)
                        )); 
                    mvt = mult( mvt, translate(ulfur.moveVec[0]/4, ulfur.moveVec[1]/4, ulfur.moveVec[2]/4));
        
                    gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
                    gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );
                }
                

            }else if(ulfur.moveX == division-1 && ulfur.x == 1 || ulfur.moveX == 0 && ulfur.x == division-2 || ulfur.moveY == division-1 && ulfur.y == 1 || ulfur.moveY == 0 && ulfur.y == division-2 || ulfur.moveZ == division-1 && ulfur.z == 1 || ulfur.moveZ == 0 && ulfur.z == division-2 ){
                //console.log("i went from end ")
                
                if(frames>(simSpeed/2)){
                    mvt = mult( mv, translate(
                        (ulfur.x -ulfur.moveVec[0]/2+ (((ulfur.moveVec[0]/2)/simSpeed)*(frames-simSpeed/2)*2))/division-0.5 +0.5/division,
                        (ulfur.y -ulfur.moveVec[1]/2+ (((ulfur.moveVec[1]/2)/simSpeed)*(frames-simSpeed/2)*2))/division-0.5 +0.5/division,
                        (ulfur.z -ulfur.moveVec[2]/2+ (((ulfur.moveVec[2]/2)/simSpeed)*(frames-simSpeed/2)*2))/division-0.5 +0.5/division));
                    mvt = mult( mvt, scalem( 1/division, 1/division, 1/division ));
                    gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
                    gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );

                }else{
                    //fara út úr heimi
                    mvt = mult( mv, translate(
                        ulfur.moveX/division-0.5 +(1-Math.abs(ulfur.moveVec[0]/2))/(2*division) + (Math.abs(ulfur.moveVec[0]/2) + ulfur.moveVec[0]/2)/(2*division), 
                        ulfur.moveY/division-0.5 +(1-Math.abs(ulfur.moveVec[1]/2))/(2*division) + (Math.abs(ulfur.moveVec[1]/2) + ulfur.moveVec[1]/2)/(2*division), 
                        ulfur.moveZ/division-0.5 +(1-Math.abs(ulfur.moveVec[2]/2))/(2*division) + (Math.abs(ulfur.moveVec[2]/2) + ulfur.moveVec[2]/2)/(2*division)
                        ));
                    mvt = mult( mvt, scalem( 
                        1/division -Math.abs((ulfur.moveVec[0]/2*frames*2)/simSpeed)/division, 
                        1/division -Math.abs((ulfur.moveVec[1]/2*frames*2)/simSpeed)/division, 
                        1/division -Math.abs((ulfur.moveVec[2]/2*frames*2)/simSpeed)/division
                    ));
                    mvt = mult( mvt, translate(-ulfur.moveVec[0]/4,-ulfur.moveVec[1]/4,-ulfur.moveVec[2]/4));
        
                    gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
                    gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );  

                    //fara inn í heim
                    //smá vitlaust
                    mvt = mult( mv, translate(
                        (ulfur.x - ulfur.moveVec[0]/2)/division-0.5 +(1-Math.abs(ulfur.moveVec[0]/2))/(2*division) + (Math.abs(ulfur.moveVec[0]/2) + ulfur.moveVec[0]/2)/(2*division) - ulfur.moveVec[0]/2/division, 
                        (ulfur.y - ulfur.moveVec[1]/2)/division-0.5 +(1-Math.abs(ulfur.moveVec[1]/2))/(2*division) + (Math.abs(ulfur.moveVec[1]/2) + ulfur.moveVec[1]/2)/(2*division) - ulfur.moveVec[1]/2/division, 
                        (ulfur.z - ulfur.moveVec[2]/2)/division-0.5 +(1-Math.abs(ulfur.moveVec[2]/2))/(2*division) + (Math.abs(ulfur.moveVec[2]/2) + ulfur.moveVec[2]/2)/(2*division) - ulfur.moveVec[2]/2/division
                        ));
                    
                    mvt = mult( mvt, scalem(
                        (Math.abs(ulfur.moveVec[0]/2) -1)/division + Math.abs((ulfur.moveVec[0]/2*frames*2)/simSpeed)/division,
                        (Math.abs(ulfur.moveVec[1]/2) -1)/division + Math.abs((ulfur.moveVec[1]/2*frames*2)/simSpeed/division),
                        (Math.abs(ulfur.moveVec[2]/2) -1)/division + Math.abs((ulfur.moveVec[2]/2*frames*2)/simSpeed/division)
                        )); 
                    mvt = mult( mvt, translate(ulfur.moveVec[0]/4, ulfur.moveVec[1]/4, ulfur.moveVec[2]/4));
        
                    gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
                    gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );
                }

            }
            else{
                //console.log("this shouldn't ever happen");
                console.log(ulfur.moveX + ", " + ulfur.x +", " + ulfur.moveY +", "+ ulfur.y + ", " + ulfur.moveZ + ", " + ulfur.z)
            }


        }
        
        else if(!ulfur.GoingThroughWorld){
            //console.log("ætti ekki að vera hér");
            mvt = mult( mv, translate((ulfur.moveX - (((ulfur.moveX-ulfur.x)/simSpeed)*frames))/division-0.5 +0.5/division,(ulfur.moveY - (((ulfur.moveY-ulfur.y)/simSpeed)*frames))/division-0.5 +0.5/division,(ulfur.moveZ - (((ulfur.moveZ-ulfur.z)/simSpeed)*frames))/division-0.5 +0.5/division));
            mvt = mult( mvt, scalem( 1/division, 1/division, 1/division ));
            gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
            gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );
   
        }
        else{
       
            //console.log(ulfur.moveX + ", " + ulfur.x +", " + ulfur.moveY +", "+ ulfur.y + ", " + ulfur.moveZ + ", " + ulfur.z)
           
            if(Math.abs(ulfur.moveVec[0]) != 2 && Math.abs(ulfur.moveVec[1]) != 2 || Math.abs(ulfur.moveVec[2]) != 2 ){
                //fara út úr heimi
                //console.log("komst hingað");
                mvt = mult( mv, translate(
                    ulfur.moveX/division-0.5 +(1-Math.abs(ulfur.moveVec[0]))/(2*division) + (Math.abs(ulfur.moveVec[0]) + ulfur.moveVec[0])/(2*division), 
                    ulfur.moveY/division-0.5 +(1-Math.abs(ulfur.moveVec[1]))/(2*division) + (Math.abs(ulfur.moveVec[1]) + ulfur.moveVec[1])/(2*division), 
                    ulfur.moveZ/division-0.5 +(1-Math.abs(ulfur.moveVec[2]))/(2*division) + (Math.abs(ulfur.moveVec[2]) + ulfur.moveVec[2])/(2*division)
                ));
                mvt = mult( mvt, scalem( 
                    1/division -Math.abs((ulfur.moveVec[0]*frames)/simSpeed)/division, 
                    1/division-Math.abs((ulfur.moveVec[1]*frames)/simSpeed)/division, 
                    1/division -Math.abs((ulfur.moveVec[2]*frames)/simSpeed)/division
                ));
                mvt = mult( mvt, translate(-ulfur.moveVec[0]/2,-ulfur.moveVec[1]/2,-ulfur.moveVec[2]/2));
    
                gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
                gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );  

                //fara inn í heim
                mvt = mult( mv, translate(
                    ulfur.x/division-0.5 +(1-Math.abs(ulfur.moveVec[0]))/(2*division) + (Math.abs(ulfur.moveVec[0]) + ulfur.moveVec[0])/(2*division) - ulfur.moveVec[0]/division, 
                    ulfur.y/division-0.5 +(1-Math.abs(ulfur.moveVec[1]))/(2*division) + (Math.abs(ulfur.moveVec[1]) + ulfur.moveVec[1])/(2*division) - ulfur.moveVec[1]/division, 
                    ulfur.z/division-0.5 +(1-Math.abs(ulfur.moveVec[2]))/(2*division) + (Math.abs(ulfur.moveVec[2]) + ulfur.moveVec[2])/(2*division) - ulfur.moveVec[2]/division
                ));
                
                mvt = mult( mvt, scalem(
                    (Math.abs(ulfur.moveVec[0]) -1)/division + Math.abs((ulfur.moveVec[0]*frames)/simSpeed)/division,
                    (Math.abs(ulfur.moveVec[1]) -1)/division + Math.abs((ulfur.moveVec[1]*frames)/simSpeed/division),
                    (Math.abs(ulfur.moveVec[2]) -1)/division + Math.abs((ulfur.moveVec[2]*frames)/simSpeed/division)
                )); 
                mvt = mult( mvt, translate(ulfur.moveVec[0]/2, ulfur.moveVec[1]/2, ulfur.moveVec[2]/2));
    
                gl.uniformMatrix4fv(mvLoc, false, flatten(mvt));
                gl.drawArrays( gl.TRIANGLES, NumVertices, 36 );
            }
            
     
        }
       
    }); 
    if(kindur.length >= division*division*0.6 &&ulfar.length == 0){
        simulationGOING = false; 
        
    } 
    else{
        if(frames==0){
            timeStepCount++; 
        }
        
    }
     
    frames++; 
   
   

    
    requestAnimFrame(render);
}