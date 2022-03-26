/////////////////////////////////////////////////////////////////
//    Sýnisforrit í Tölvugrafík
//     Fánastöng með íslenska fánanum.  Hægt að snúa stönginni
//     og færa til.
//
//    Hjálmtýr Hafsteinsson, mars 2022
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numFlagVertices  = 6;
var numPoleVertices  = 36;

var program1;
var program2;

var texture;

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;
var segments = 100; 

var zDist = 5.0;

var locProjection1;
var locModelView1;
var locPosition1;
var locProjection2;
var locModelView2;
var locPosition2;
var locTexCoord;
var startTime = Date.now();
var elapsedTime; 
var flagMove = 0.0; 

var poleBuffer;
var flagBuffer;
var vertices = []; 
var texCoords = []; 
// Tveir þríhyrningar sem mynda spjald í z=0 planinu

for (let i = 0; i < segments; i++) {
    vertices.push(vec4( -1.25 + i*2.5/segments, -0.9, 0.0, 1.0))
    vertices.push(vec4(  1.25 - (segments-i-1)*2.5/segments, -0.9, 0.0, 1.0))
    vertices.push(vec4(  1.25 - (segments-i-1)*2.5/segments,  0.9, 0.0, 1.0))
    vertices.push(vec4(  1.25 - (segments-i-1)*2.5/segments,  0.9, 0.0, 1.0))
    vertices.push(vec4( -1.25 + i*2.5/segments,  0.9, 0.0, 1.0))
    vertices.push(vec4( -1.25 + i*2.5/segments, -0.9, 0.0, 1.0))
    
    
    texCoords.push(vec2( 0.0 + i/segments, 0.0 ))
    texCoords.push(vec2( 1.0 - (segments-i-1)/segments, 0.0 ))
    texCoords.push(vec2( 1.0 - (segments-i-1)/segments, 1.0 ))
    texCoords.push(vec2( 1.0 - (segments-i-1)/segments, 1.0 ))
    texCoords.push(vec2( 0.0 + i/segments, 1.0 ))
    texCoords.push(vec2( 0.0 + i/segments, 0.0 ))
}


// Hnútar fyrir tening (sem myndar fánastöngina)
var cVertices = [
    // front side:
    vec3( -0.5,  0.5,  0.5 ), vec3( -0.5, -0.5,  0.5 ), vec3(  0.5, -0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ), vec3(  0.5,  0.5,  0.5 ), vec3( -0.5,  0.5,  0.5 ),
    // right side:
    vec3(  0.5,  0.5,  0.5 ), vec3(  0.5, -0.5,  0.5 ), vec3(  0.5, -0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 ), vec3(  0.5,  0.5, -0.5 ), vec3(  0.5,  0.5,  0.5 ),
    // bottom side:
    vec3(  0.5, -0.5,  0.5 ), vec3( -0.5, -0.5,  0.5 ), vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5, -0.5, -0.5 ), vec3(  0.5, -0.5, -0.5 ), vec3(  0.5, -0.5,  0.5 ),
    // top side:
    vec3(  0.5,  0.5, -0.5 ), vec3( -0.5,  0.5, -0.5 ), vec3( -0.5,  0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ), vec3(  0.5,  0.5,  0.5 ), vec3(  0.5,  0.5, -0.5 ),
    // back side:
    vec3( -0.5, -0.5, -0.5 ), vec3( -0.5,  0.5, -0.5 ), vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ), vec3(  0.5, -0.5, -0.5 ), vec3( -0.5, -0.5, -0.5 ),
    // left side:
    vec3( -0.5,  0.5, -0.5 ), vec3( -0.5, -0.5, -0.5 ), vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5,  0.5 ), vec3( -0.5,  0.5,  0.5 ), vec3( -0.5,  0.5, -0.5 )
];



function configureTexture( image, prog ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
    gl.useProgram(prog);
    gl.uniform1i(gl.getUniformLocation(prog, "texture"), 0);
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    // Litarar sem lita með einum lit (sendur sem uniform-breyta)
    program1 = initShaders( gl, "vertex-shader", "fragment-shader" );

    // Litarar sem lita með mynstri
    program2 = initShaders( gl, "vertex-shader2", "fragment-shader2" );
    
    
    // VBO for the flagpole
    poleBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, poleBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cVertices), gl.STATIC_DRAW );

    locPosition1 = gl.getAttribLocation( program1, "vPosition" );
    gl.enableVertexAttribArray( locPosition1 );

    locProjection1 = gl.getUniformLocation( program1, "projection" );
    locModelView1 = gl.getUniformLocation( program1, "modelview" );
    

    
    flagBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, flagBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    
    locPosition2 = gl.getAttribLocation( program2, "vPosition" );
    gl.enableVertexAttribArray( locPosition2 );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );
    
    locTexCoord = gl.getAttribLocation( program2, "vTexCoord" );
    gl.vertexAttribPointer( locTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( locTexCoord );
    
    var image = document.getElementById("texImage");


    configureTexture( image, program2 );

    locProjection2 = gl.getUniformLocation( program2, "projection" );
    locModelView2 = gl.getUniformLocation( program2, "modelview" );
    locWave = gl.getUniformLocation( program2, "wave" );
    


    var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    
    gl.useProgram(program1);
    gl.uniformMatrix4fv(locProjection1, false, flatten(proj));
    
    gl.useProgram(program2);
    gl.uniformMatrix4fv(locProjection2, false, flatten(proj));
    

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.clientX;
        origY = e.clientY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (origX - e.clientX) ) % 360;
            spinX = ( spinX + (origY - e.clientY) ) % 360;
            origX = e.clientX;
            origY = e.clientY;
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
            case 87:    // up arrow
                flagMove +=0.05; 
                if (flagMove >= 0){
                    flagMove = 0; 
                }
                break;
            case 83:    // down arrow
                flagMove -=0.05; 
                if (flagMove <= -2.0){
                    flagMove = -2.0; 
                }
                break;
            case 33:    // up arrow
                flagMove +=0.05; 
                if (flagMove >= 0){
                    flagMove = 0; 
                }
                break;
            case 34:    // down arrow
                flagMove -=0.05; 
                if (flagMove <= -2.0){
                    flagMove = -2.0; 
                }
                break;
            }
     }  );  

    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.2;
         } else {
             zDist -= 0.2;
         }
    }  );  

  


       
    render();
 
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    elapsedTime = Date.now() - startTime; 
    // staðsetja áhorfanda og meðhöndla músarhreyfingu
    var mv = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX( spinX ) );
    mv = mult( mv, rotateY( spinY ) );
    
    var mv2 = mv;
    
    // teikna fánastöngina með liturum 1
    gl.useProgram(program1);
    mv = mult( mv, translate(-0.5, 0.0, 0.0) );
    mv = mult( mv, scalem(0.08, 3.0, 0.08) );
    gl.uniformMatrix4fv(locModelView1, false, flatten(mv));
    
    gl.uniform4fv( gl.getUniformLocation( program1, "Color" ), vec4(0.6, 0.6, 0.6, 1.0) );

    gl.bindBuffer( gl.ARRAY_BUFFER, poleBuffer );
    gl.vertexAttribPointer( locPosition1, 3, gl.FLOAT, false, 0, 0 );
  
    gl.drawArrays( gl.TRIANGLES, 0, numPoleVertices );


    // teikna fánann með liturum 2
    gl.useProgram(program2);

    gl.uniform1f( locWave, elapsedTime/80);
    mv2 = mult( mv2, translate(0.16, 1.0, 0.0) );
    mv2 = mult( mv2, translate(0.0, flagMove, 0.0) );
    mv2 = mult( mv2, scalem(0.5, 0.5, 0.5) );
    gl.uniformMatrix4fv(locModelView2, false, flatten(mv2));

    gl.bindBuffer( gl.ARRAY_BUFFER, flagBuffer );
    gl.vertexAttribPointer( locPosition2, 4, gl.FLOAT, false, 0, 0 );
    
    gl.drawArrays( gl.TRIANGLES, 0, numFlagVertices*segments );

    requestAnimFrame(render);
}
