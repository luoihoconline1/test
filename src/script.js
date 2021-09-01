// This THREEx helper makes it easy to handle the mouse events in your 3D scene
//
// * CHANGES NEEDED
//   * handle drag/drop
//   * notify events not object3D - like DOM
//     * so single object with property
//   * DONE bubling implement bubling/capturing
//   * DONE implement event.stopPropagation()
//   * DONE implement event.type = "click" and co
//   * DONE implement event.target
//
// # Lets get started
//
// First you include it in your page
//
// ```<script src='threex.domevent.js'>< /script>```
//
// # use the object oriented api
//
// You bind an event like this
// 
// ```mesh.on('click', function(object3d){ ... })```
//
// To unbind an event, just do
//
// ```mesh.off('click', function(object3d){ ... })```
//
// As an alternative, there is another naming closer DOM events.
// Pick the one you like, they are doing the same thing
//
// ```mesh.addEventListener('click', function(object3d){ ... })```
// ```mesh.removeEventListener('click', function(object3d){ ... })```
//
// # Supported Events
//
// Always in a effort to stay close to usual pratices, the events name are the same as in DOM.
// The semantic is the same too.
// Currently, the available events are
// [click, dblclick, mouseup, mousedown](http://www.quirksmode.org/dom/events/click.html),
// [mouseover and mouse out](http://www.quirksmode.org/dom/events/mouseover.html).
//
// # use the standalone api
//
// The object-oriented api modifies THREE.Object3D class.
// It is a global class, so it may be legitimatly considered unclean by some people.
// If this bother you, simply do ```THREEx.DomEvents.noConflict()``` and use the
// standalone API. In fact, the object oriented API is just a thin wrapper
// on top of the standalone API.
//
// First, you instanciate the object
//
// ```var domEvent = new THREEx.DomEvent();```
// 
// Then you bind an event like this
//
// ```domEvent.bind(mesh, 'click', function(object3d){ object3d.scale.x *= 2; });```
//
// To unbind an event, just do
//
// ```domEvent.unbind(mesh, 'click', callback);```
//
// 
// # Code

//

/** @namespace */
var THREEx		= THREEx 		|| {};

// # Constructor
THREEx.DomEvents	= function(camera, domElement)
{
	this._camera	= camera || null;
	this._domElement= domElement || document;
	this._raycaster = new THREE.Raycaster();
	this._selected	= null;
	this._boundObjs	= {};
	// Bind dom event for mouse and touch
	var _this	= this;

	this._$onClick		= function(){ _this._onClick.apply(_this, arguments);		};
	this._$onDblClick	= function(){ _this._onDblClick.apply(_this, arguments);	};
	this._$onMouseMove	= function(){ _this._onMouseMove.apply(_this, arguments);	};
	this._$onMouseDown	= function(){ _this._onMouseDown.apply(_this, arguments);	};
	this._$onMouseUp	= function(){ _this._onMouseUp.apply(_this, arguments);		};
	this._$onTouchMove	= function(){ _this._onTouchMove.apply(_this, arguments);	};
	this._$onTouchStart	= function(){ _this._onTouchStart.apply(_this, arguments);	};
	this._$onTouchEnd	= function(){ _this._onTouchEnd.apply(_this, arguments);	};
	this._$onContextmenu	= function(){ _this._onContextmenu.apply(_this, arguments);	};
	this._domElement.addEventListener( 'click'	, this._$onClick	, false );
	this._domElement.addEventListener( 'dblclick'	, this._$onDblClick	, false );
	this._domElement.addEventListener( 'mousemove'	, this._$onMouseMove	, false );
	this._domElement.addEventListener( 'mousedown'	, this._$onMouseDown	, false );
	this._domElement.addEventListener( 'mouseup'	, this._$onMouseUp	, false );
	this._domElement.addEventListener( 'touchmove'	, this._$onTouchMove	, false );
	this._domElement.addEventListener( 'touchstart'	, this._$onTouchStart	, false );
	this._domElement.addEventListener( 'touchend'	, this._$onTouchEnd	, false );
	this._domElement.addEventListener( 'contextmenu', this._$onContextmenu	, false );
	
}

// # Destructor
THREEx.DomEvents.prototype.destroy	= function()
{
	// unBind dom event for mouse and touch
	this._domElement.removeEventListener( 'click'		, this._$onClick	, false );
	this._domElement.removeEventListener( 'dblclick'	, this._$onDblClick	, false );
	this._domElement.removeEventListener( 'mousemove'	, this._$onMouseMove	, false );
	this._domElement.removeEventListener( 'mousedown'	, this._$onMouseDown	, false );
	this._domElement.removeEventListener( 'mouseup'		, this._$onMouseUp	, false );
	this._domElement.removeEventListener( 'touchmove'	, this._$onTouchMove	, false );
	this._domElement.removeEventListener( 'touchstart'	, this._$onTouchStart	, false );
	this._domElement.removeEventListener( 'touchend'	, this._$onTouchEnd	, false );
	this._domElement.removeEventListener( 'contextmenu'	, this._$onContextmenu	, false );
}

THREEx.DomEvents.eventNames	= [
	"click",
	"dblclick",
	"mouseover",
	"mouseout",
	"mousemove",
	"mousedown",
	"mouseup",
	"contextmenu",
	"touchstart",
	"touchend"
];

THREEx.DomEvents.prototype._getRelativeMouseXY	= function(domEvent){
	var element = domEvent.target || domEvent.srcElement;
	if (element.nodeType === 3) {
		element = element.parentNode; // Safari fix -- see http://www.quirksmode.org/js/events_properties.html
	}
	
	//get the real position of an element relative to the page starting point (0, 0)
	//credits go to brainjam on answering http://stackoverflow.com/questions/5755312/getting-mouse-position-relative-to-content-area-of-an-element
	var elPosition	= { x : 0 , y : 0};
	var tmpElement	= element;
	//store padding
	var style	= getComputedStyle(tmpElement, null);
	elPosition.y += parseInt(style.getPropertyValue("padding-top"), 10);
	elPosition.x += parseInt(style.getPropertyValue("padding-left"), 10);
	//add positions
	do {
		elPosition.x	+= tmpElement.offsetLeft;
		elPosition.y	+= tmpElement.offsetTop;
		style		= getComputedStyle(tmpElement, null);

		elPosition.x	+= parseInt(style.getPropertyValue("border-left-width"), 10);
		elPosition.y	+= parseInt(style.getPropertyValue("border-top-width"), 10);
	} while(tmpElement = tmpElement.offsetParent);
	
	var elDimension	= {
		width	: (element === window) ? window.innerWidth	: element.offsetWidth,
		height	: (element === window) ? window.innerHeight	: element.offsetHeight
	};
	
	return {
		x : +((domEvent.pageX - elPosition.x) / elDimension.width ) * 2 - 1,
		y : -((domEvent.pageY - elPosition.y) / elDimension.height) * 2 + 1
	};
};


/********************************************************************************/
/*		domevent context						*/
/********************************************************************************/

// handle domevent context in object3d instance

THREEx.DomEvents.prototype._objectCtxInit	= function(object3d){
	object3d._3xDomEvent = {};
}
THREEx.DomEvents.prototype._objectCtxDeinit	= function(object3d){
	delete object3d._3xDomEvent;
}
THREEx.DomEvents.prototype._objectCtxIsInit	= function(object3d){
	return object3d._3xDomEvent ? true : false;
}
THREEx.DomEvents.prototype._objectCtxGet		= function(object3d){
	return object3d._3xDomEvent;
}

/********************************************************************************/
/*										*/
/********************************************************************************/

/**
 * Getter/Setter for camera
*/
THREEx.DomEvents.prototype.camera	= function(value)
{
	if( value )	this._camera	= value;
	return this._camera;
}

THREEx.DomEvents.prototype.bind	= function(object3d, eventName, callback, useCapture)
{
	console.assert( THREEx.DomEvents.eventNames.indexOf(eventName) !== -1, "not available events:"+eventName );

	if( !this._objectCtxIsInit(object3d) )	this._objectCtxInit(object3d);
	var objectCtx	= this._objectCtxGet(object3d);	
	if( !objectCtx[eventName+'Handlers'] )	objectCtx[eventName+'Handlers']	= [];

	objectCtx[eventName+'Handlers'].push({
		callback	: callback,
		useCapture	: useCapture
	});
	
	// add this object in this._boundObjs
	if( this._boundObjs[eventName] === undefined ){
		this._boundObjs[eventName]	= [];	
	}
	this._boundObjs[eventName].push(object3d);
}
THREEx.DomEvents.prototype.addEventListener	= THREEx.DomEvents.prototype.bind

THREEx.DomEvents.prototype.unbind	= function(object3d, eventName, callback, useCapture)
{
	console.assert( THREEx.DomEvents.eventNames.indexOf(eventName) !== -1, "not available events:"+eventName );

	if( !this._objectCtxIsInit(object3d) )	this._objectCtxInit(object3d);

	var objectCtx	= this._objectCtxGet(object3d);
	if( !objectCtx[eventName+'Handlers'] )	objectCtx[eventName+'Handlers']	= [];

	var handlers	= objectCtx[eventName+'Handlers'];
	for(var i = 0; i < handlers.length; i++){
		var handler	= handlers[i];
		if( callback != handler.callback )	continue;
		if( useCapture != handler.useCapture )	continue;
		handlers.splice(i, 1)
		break;
	}
	// from this object from this._boundObjs
	var index	= this._boundObjs[eventName].indexOf(object3d);
	console.assert( index !== -1 );
	this._boundObjs[eventName].splice(index, 1);
}
THREEx.DomEvents.prototype.removeEventListener	= THREEx.DomEvents.prototype.unbind

THREEx.DomEvents.prototype._bound	= function(eventName, object3d)
{
	var objectCtx	= this._objectCtxGet(object3d);
	if( !objectCtx )	return false;
	return objectCtx[eventName+'Handlers'] ? true : false;
}

/********************************************************************************/
/*		onMove								*/
/********************************************************************************/

// # handle mousemove kind of events

THREEx.DomEvents.prototype._onMove	= function(eventName, mouseX, mouseY, origDomEvent)
{
//console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
	// get objects bound to this event
	var boundObjs	= this._boundObjs[eventName];
	if( boundObjs === undefined || boundObjs.length === 0 )	return;
	// compute the intersection
	var vector = new THREE.Vector2();

	// update the picking ray with the camera and mouse position
	vector.set( mouseX, mouseY );
	this._raycaster.setFromCamera( vector, this._camera );	

	var intersects = this._raycaster.intersectObjects( boundObjs );

	var oldSelected	= this._selected;
	
	if( intersects.length > 0 ){
		var notifyOver, notifyOut, notifyMove;
		var intersect	= intersects[ 0 ];
		var newSelected	= intersect.object;
		this._selected	= newSelected;
		// if newSelected bound mousemove, notify it
		notifyMove	= this._bound('mousemove', newSelected);

		if( oldSelected != newSelected ){
			// if newSelected bound mouseenter, notify it
			notifyOver	= this._bound('mouseover', newSelected);
			// if there is a oldSelect and oldSelected bound mouseleave, notify it
			notifyOut	= oldSelected && this._bound('mouseout', oldSelected);
		}
	}else{
		// if there is a oldSelect and oldSelected bound mouseleave, notify it
		notifyOut	= oldSelected && this._bound('mouseout', oldSelected);
		this._selected	= null;
	}


	// notify mouseMove - done at the end with a copy of the list to allow callback to remove handlers
	notifyMove && this._notify('mousemove', newSelected, origDomEvent, intersect);
	// notify mouseEnter - done at the end with a copy of the list to allow callback to remove handlers
	notifyOver && this._notify('mouseover', newSelected, origDomEvent, intersect);
	// notify mouseLeave - done at the end with a copy of the list to allow callback to remove handlers
	notifyOut  && this._notify('mouseout' , oldSelected, origDomEvent, intersect);
}


/********************************************************************************/
/*		onEvent								*/
/********************************************************************************/

// # handle click kind of events

THREEx.DomEvents.prototype._onEvent	= function(eventName, mouseX, mouseY, origDomEvent)
{
	//console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
	// get objects bound to this event
	var boundObjs	= this._boundObjs[eventName];
	if( boundObjs === undefined || boundObjs.length === 0 )	return;
	// compute the intersection
	var vector = new THREE.Vector2();

	// update the picking ray with the camera and mouse position
	vector.set( mouseX, mouseY );
	this._raycaster.setFromCamera( vector, this._camera );	

	var intersects = this._raycaster.intersectObjects( boundObjs, true);
	// if there are no intersections, return now
	if( intersects.length === 0 )	return;

	// init some variables
	var intersect	= intersects[0];
	var object3d	= intersect.object;
	var objectCtx	= this._objectCtxGet(object3d);
	var objectParent = object3d.parent;

	while ( typeof(objectCtx) == 'undefined' && objectParent )
	{
	    objectCtx = this._objectCtxGet(objectParent);
	    objectParent = objectParent.parent;
	}
	if( !objectCtx )	return;

	// notify handlers
	this._notify(eventName, object3d, origDomEvent, intersect);
}

THREEx.DomEvents.prototype._notify	= function(eventName, object3d, origDomEvent, intersect)
{
	var objectCtx	= this._objectCtxGet(object3d);
	var handlers	= objectCtx ? objectCtx[eventName+'Handlers'] : null;
	
	// parameter check
	console.assert(arguments.length === 4)

	// do bubbling
	if( !objectCtx || !handlers || handlers.length === 0 ){
		object3d.parent && this._notify(eventName, object3d.parent, origDomEvent, intersect);
		return;
	}
	
	// notify all handlers
	var handlers	= objectCtx[eventName+'Handlers'];
	for(var i = 0; i < handlers.length; i++){
		var handler	= handlers[i];
		var toPropagate	= true;
		handler.callback({
			type		: eventName,
			target		: object3d,
			origDomEvent	: origDomEvent,
			intersect	: intersect,
			stopPropagation	: function(){
				toPropagate	= false;
			}
		});
		if( !toPropagate )	continue;
		// do bubbling
		if( handler.useCapture === false ){
			object3d.parent && this._notify(eventName, object3d.parent, origDomEvent, intersect);
		}
	}
}

/********************************************************************************/
/*		handle mouse events						*/
/********************************************************************************/
// # handle mouse events

THREEx.DomEvents.prototype._onMouseDown	= function(event){ return this._onMouseEvent('mousedown', event);	}
THREEx.DomEvents.prototype._onMouseUp	= function(event){ return this._onMouseEvent('mouseup'	, event);	}


THREEx.DomEvents.prototype._onMouseEvent	= function(eventName, domEvent)
{
	var mouseCoords = this._getRelativeMouseXY(domEvent);
	this._onEvent(eventName, mouseCoords.x, mouseCoords.y, domEvent);
}

THREEx.DomEvents.prototype._onMouseMove	= function(domEvent)
{
	var mouseCoords = this._getRelativeMouseXY(domEvent);
	this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
	this._onMove('mouseover', mouseCoords.x, mouseCoords.y, domEvent);
	this._onMove('mouseout' , mouseCoords.x, mouseCoords.y, domEvent);
}

THREEx.DomEvents.prototype._onClick		= function(event)
{
	// TODO handle touch ?
	this._onMouseEvent('click'	, event);
}
THREEx.DomEvents.prototype._onDblClick		= function(event)
{
	// TODO handle touch ?
	this._onMouseEvent('dblclick'	, event);
}

THREEx.DomEvents.prototype._onContextmenu	= function(event)
{
	//TODO don't have a clue about how this should work with touch..
	this._onMouseEvent('contextmenu'	, event);
}

/********************************************************************************/
/*		handle touch events						*/
/********************************************************************************/
// # handle touch events


THREEx.DomEvents.prototype._onTouchStart	= function(event){ return this._onTouchEvent('touchstart', event);	}
THREEx.DomEvents.prototype._onTouchEnd	= function(event){ return this._onTouchEvent('touchend'	, event);	}

THREEx.DomEvents.prototype._onTouchMove	= function(domEvent)
{
	if( domEvent.touches.length != 1 )	return undefined;

	domEvent.preventDefault();

	var mouseX	= +(domEvent.touches[ 0 ].pageX / window.innerWidth ) * 2 - 1;
	var mouseY	= -(domEvent.touches[ 0 ].pageY / window.innerHeight) * 2 + 1;
	this._onMove('mousemove', mouseX, mouseY, domEvent);
	this._onMove('mouseover', mouseX, mouseY, domEvent);
	this._onMove('mouseout' , mouseX, mouseY, domEvent);
}

THREEx.DomEvents.prototype._onTouchEvent	= function(eventName, domEvent)
{
	if( domEvent.touches.length != 1 )	return undefined;

	domEvent.preventDefault();

	var mouseX	= +(domEvent.touches[ 0 ].pageX / window.innerWidth ) * 2 - 1;
	var mouseY	= -(domEvent.touches[ 0 ].pageY / window.innerHeight) * 2 + 1;
	this._onEvent(eventName, mouseX, mouseY, domEvent);	
}






import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Stats from 'stats.js'

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );
/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//Clock
const clock = new THREE.Clock()
/**
 * Update all materials
 */
const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            // child.material.envMap = environmentMap
            child.material.envMapIntensity = debugObject.envMapIntensity
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
        }
    })
    scene.traverse((child) =>
    {
        if (child.visible == false) {
            console.log(child);
        }
    })
}

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/7/px.jpg',
    '/textures/environmentMaps/7/nx.jpg',
    '/textures/environmentMaps/7/py.jpg',
    '/textures/environmentMaps/7/ny.jpg',
    '/textures/environmentMaps/7/pz.jpg',
    '/textures/environmentMaps/7/nz.jpg'
])

environmentMap.encoding = THREE.sRGBEncoding

scene.background = environmentMap
scene.environment = environmentMap

debugObject.envMapIntensity = 5
gui.add(debugObject, 'envMapIntensity').min(0).max(10).step(0.001).onChange(updateAllMaterials).setValue(0);
let mixer = null;
/**
 * Models
 */
let object = 1;
gltfLoader.load(
    '/models/beautiful6.glb',
    (gltf) =>
    {
        object = gltf.scene
        console.log(gltf);
        mixer = new THREE.AnimationMixer(gltf.scene);
        for (let ani of gltf.animations) {
            let action = mixer.clipAction(ani);
            action.play()
        }
        /*gltf.scene.children[272].children[1].material.emissiveIntensity = 100;
		gltf.scene.children[272].children[2].material.emissiveIntensity = 100;
		gltf.scene.children[272].children[3].material.emissiveIntensity = 10;
		gltf.scene.children[272].children[4].material.emissiveIntensity = 10;
		gltf.scene.children[105].children[5].children[1].material.emissiveIntensity = 10;
		gltf.scene.children[104].children[5].children[1].material.emissiveIntensity = 10;
		/*gltf.scene.children[272].children[3].material.emissive = new THREE.Color({
            isColor: true,
            r: 0.044379,
            g: 1,
            b: 0.215095
        })
		gltf.scene.children[272].children[4].material.emissive = new THREE.Color({
            isColor: true,
            r: 1,
            g: 0.224,
            b: 0.028
        })
        /*gltf.scene.children[11].material.emissiveIntensity = 10;
        gltf.scene.children[11].material.emissive = new THREE.Color({
            isColor: true,
            r: 1,
            g: 0.224,
            b: 0.028
        })
        gltf.scene.children[11].colorWhite = false;
        console.log(gltf);
        mixer = new THREE.AnimationMixer(gltf.scene);
        const action = mixer.clipAction(gltf.animations[1]);
        action.play()*/
        /*Hogwart
        gltf.scene.children[83].children[8].children[2].material.emissiveIntensity = 200;
        gltf.scene.children[83].children[8].children[2].material.emissive = new THREE.Color({
            isColor: true,
            r: 1,
            g: 0.224,
            b: 0.028
        });
        /*Gorija
        gltf.scene.children[16].material.emissiveIntensity = 100;
        gltf.scene.children[53].material.emissiveIntensity = 100;
        gltf.scene.children[52].material.emissiveIntensity = 100;
        gltf.scene.children[29].children[0].material.emissiveIntensity = 500;
        gltf.scene.children[9].children[10].children[0].material.emissiveIntensity = 50;
        console.log(gltf.scene.children[29].children[0].material.emissiveIntensity);*/
        gltf.scene.scale.set(2, 2, 2)
        gltf.scene.position.set(0, - 4, 0)
        gltf.scene.rotation.y = Math.PI * 0.5
        scene.add(gltf.scene)

        gui.add(gltf.scene.rotation, 'y').min(- Math.PI).max(Math.PI).step(0.001).name('rotation')

        updateAllMaterials()
        domEvents.addEventListener(gltf.scene.children[3], 'click', function(event){
            console.log('you clicked on the mesh')
        }, false)
		
    }
)




// gltfLoader.load(
//     '/models/hamburger.glb',
//     (gltf) =>
//     {
//         gltf.scene.scale.set(0.3, 0.3, 0.3)
//         gltf.scene.position.set(0, - 1, 0)
//         scene.add(gltf.scene)

//         updateAllMaterials()
//     }
// )

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 2)
directionalLight.castShadow = false
directionalLight.shadow.camera.far = 15
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 3, - 2.25)
scene.add(directionalLight)



gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('lightIntensity').setValue(0)
gui.add(directionalLight.position, 'x').min(- 5).max(5).step(0.001).name('lightX')
gui.add(directionalLight.position, 'y').min(- 5).max(5).step(0.001).name('lightY')
gui.add(directionalLight.position, 'z').min(- 5).max(5).step(0.001).name('lightZ')

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth / 10 * 7,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth / 10 * 7
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 300)
camera.position.set(7, 1, - 2)
//camera.rotation.y = 0.828;
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 1
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/*gui
    .add(renderer, 'toneMapping', {
        No: THREE.NoToneMapping,
        Linear: THREE.LinearToneMapping,
        Reinhard: THREE.ReinhardToneMapping,
        Cineon: THREE.CineonToneMapping,
        ACESFilmic: THREE.ACESFilmicToneMapping
    })
    .onFinishChange(() =>
    {
        renderer.toneMapping = Number(renderer.toneMapping)
        updateAllMaterials()
    })
/*gui.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.001).setValue(1);*/

/**
 * Animate
 */
let previousTime = 0;
const tick = () =>
{
	stats.begin();
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;
	//console.log(deltaTime);


    //Update mixer
    if (mixer !== null) {
        mixer.update(deltaTime);
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
	stats.end();
}

tick()
console.log(scene);

/*var domEvents	= new THREEx.DomEvents(camera, renderer.domElement);

const delay = ms => new Promise(res => setTimeout(res, ms));
const display = async function() {
	await delay(2000);
	controls.update();
	renderer.render(scene, camera)
}
//display();
const left = document.querySelector('.left');
const right = document.querySelector('.right');
left.onclick = function () {
	camera_left()
}
right.onclick = function () {
	camera_right()
}
function camera_left() {
	camera.rotation.y -= 0.01;
	renderer.render(scene, camera)
	console.log(camera.rotation);
}
function camera_right() {
	camera.rotation.y += 0.01;
	renderer.render(scene, camera);
	console.log(camera.rotation);
}*/