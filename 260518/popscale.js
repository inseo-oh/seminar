
'use strict';

function loadScriptFile (scriptSrc, callBack) {
	var script = document.createElement('script');
	script.src = scriptSrc;
	if (callBack) {
		script.onload = function () {
			callBack();
		};
	}
	document.head.appendChild(script);
}

function run (callBack) {
	if(window.document) {
        if ( window.document.readyState === "complete" ) {
            setTimeout( run );
        } else {
            window.addEventListener("load", completed, false );
        }
    }
    function completed() {
        window.removeEventListener( "load", completed, false );
        callBack();
    }
}


loadScriptFile('responsive.js', function (){});

run(function () {
    var isAndroid = (/(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki|iphone|ipad|ipod|blackBerry|iemobile)[\/\s-]?([\w\.]+)*/i).test(navigator.userAgent);
    var wrap = document.querySelector('#wrap');
    var container = document.querySelector('#container');

    setTimeout(function () {
        FORTEACHERCD.responsive.currentContainerSize.containerWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        FORTEACHERCD.responsive.currentContainerSize.containerHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        FORTEACHERCD.responsive.setScaleElement(wrap);
        wrap.style.visibility = 'visible';
        container.style.visibility = 'visible';
    }, (isAndroid ? 500 : 0));

	window.addEventListener('resize', function () {
		setTimeout(function () {
	        FORTEACHERCD.responsive.currentContainerSize.containerWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	        FORTEACHERCD.responsive.currentContainerSize.containerHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	        FORTEACHERCD.responsive.setScaleElement(wrap);
            wrap.style.visibility = 'visible';
            container.style.visibility = 'visible';
	    }, (isAndroid ? 500 : 0));
	}, false);
});
