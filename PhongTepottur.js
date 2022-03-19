/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Tepottur sem litaður er með Phong litun.  Hægt að snúa
//     honum með músinni og þysja með músarhjóli
//
//    Hjálmtýr Hafsteinsson, mars 2022
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var index = 0;

var pointsArray = [];
var normalsArray = [];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;
var colorNum = 724; 

var zDist = -5.0;

var fovy = 60.0;
var near = 0.2;
var far = 100.0;

var lightPosition = vec4(10.0, 10.0, 10.0, 1.0 );
var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.2, 0.0, 0.2, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 50.0;
var materialDiscard = 2.0;


var ctm;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var normalMatrix, normalMatrixLoc, discardLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);


    var myTeapot = teapot(15);
    myTeapot.scale(0.5, 0.5, 0.5);

    console.log(myTeapot.TriangleVertices.length);

    points = myTeapot.TriangleVertices;
    normals = myTeapot.Normals;

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);


    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    diffuseloc = gl.getUniformLocation(program, "diffuseProduct");


    projectionMatrix = perspective( fovy, 1.0, near, far );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct) );
   
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), materialShininess );
    discardLoc =  gl.getUniformLocation(program, "brightDiscard");

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
    	    spinY = ( spinY + (e.clientX - origX) ) % 360;
            spinX = ( spinX + (e.clientY - origY) ) % 360;
            origX = e.clientX;
            origY = e.clientY;
        }
    } );

    // Event listener for mousewheel
    window.addEventListener("wheel", function(e){
         if( e.deltaY > 0.0 ) {
             zDist += 0.2;
         } else {
             zDist -= 0.2;
         }
    }   );
       
    // Event listener for keyboard
       window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 37:    // left arrow
                colorNum++; 
                materialDiffuse = vec4(Math.floor(colorNum/100)*0.1+0.1, Math.floor((colorNum%100)/10)*0.1+0.1, Math.floor(colorNum%10)*0.1+0.1, 1.0);
                diffuseProduct = mult(lightDiffuse, materialDiffuse);
                break;
            case 38:    // up arrow
             
                materialDiscard  = Math.min(materialDiscard -0.1, 4.0)
                break; 
            case 39:    // right arrow
            colorNum--; 
            materialDiffuse = vec4(Math.floor(colorNum/100)*0.1+0.1, Math.floor((colorNum%100)/10)*0.1+0.1, Math.floor(colorNum%10)*0.1+0.1, 1.0);
            diffuseProduct = mult(lightDiffuse, materialDiffuse);
                break;
            case 40:    // down arrow
                materialDiscard  = Math.max(materialDiscard +0.1, 0.0)
                break;
        }
    } );




    render();
}



function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    modelViewMatrix = lookAt( vec3(0.0, 0.0, zDist), at, up );
    modelViewMatrix = mult( modelViewMatrix, rotateY( -spinY ) );
    modelViewMatrix = mult( modelViewMatrix, rotateX( spinX ) );

    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniform4fv(diffuseloc, diffuseProduct);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
    gl.uniform1f(discardLoc, materialDiscard );

    gl.drawArrays( gl.TRIANGLES, 0, points.length );
    window.requestAnimFrame(render);
}
