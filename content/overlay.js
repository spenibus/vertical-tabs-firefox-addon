//*********** export named single global object while using shorthand internally
var spenibus_verticalTabs = (function() {




    //************************************************************** run on load
    window.addEventListener('load', (function f(){

        // remove init listener
        window.removeEventListener('load', f, false);

        // load style
        s.loadStyle();

        // update gui to show vertical tab bar
        s.windowUpdate();

    }), false);




    //******************************************************* internal shorthand
    var s = {};




    //******************************************************************** prefs
    s.prefs = {};


    s.prefs.service = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService)
        .getBranch("extensions.spenibus_verticalTabs.");


    s.prefs.funcs = {
        '0'   : function(){return null;},
        '32'  : s.prefs.service.getCharPref,
        '64'  : s.prefs.service.getIntPref,
        '128' : s.prefs.service.getBoolPref,
    }


    s.prefs.get = function(n) {
        var t = s.prefs.service.getPrefType(n);
        var f = s.prefs.funcs[t];
        return f(n);
    };




    //********************************************************* show/hide tabbar
    s.showHide = function() {

        var hidden = !this.node_container.hidden;

        this.node_container.hidden = hidden;
        this.node_splitter.hidden  = hidden;
    };



    //*************************************************************** load style
    s.loadStyle = function() {

        // get browser
        var node = document.getElementById('browser');


        // compact style
        if(s.prefs.get('style_compact_enable')) {
            node.classList.add('spenibus_verticalTabs_compact');
        }
    };




    //**************************************************************************
    s.windowUpdate = function() {

        // addon elements
        s.node_container   = document.getElementById('spenibus_verticalTabs_container');
        s.node_buttons     = document.getElementById('spenibus_verticalTabs_buttons');
        s.node_closeButton = document.getElementById('spenibus_verticalTabs_closeButton');
        s.node_splitter    = document.getElementById('spenibus_verticalTabs_splitter');

        // native elements
        s.node_tabsToolbar    = document.getElementById('TabsToolbar');
        s.node_tabbrowsertabs = document.getElementById('tabbrowser-tabs');

        // native buttons
        s.node_newtabbutton  = document.getElementById('new-tab-button');
        s.node_alltabsbutton = document.getElementById('alltabs-button');




        // group buttons horizontally
        s.node_buttons.appendChild(s.node_alltabsbutton);
        s.node_buttons.appendChild(s.node_newtabbutton);
        s.node_buttons.appendChild(s.node_closeButton);

        // move buttons holder inside tabs toolbar
        s.node_tabbrowsertabs.parentNode.insertBefore(
            s.node_buttons,
            s.node_tabbrowsertabs.nextSibling
        );




        // put tab bar in vertical box
        s.node_container.appendChild(s.node_tabsToolbar);

        // orient tab strip vertically
        s.node_tabbrowsertabs.mTabstrip.setAttribute('orient', 'vertical');

        // make tabs toolbar fill its container
        s.node_tabsToolbar.setAttribute('flex', '1');

        // orient tabs toolbar vertically
        s.node_tabsToolbar.setAttribute('orient', 'vertical');

        // reverse elements order within tabs toolbar
        s.node_tabsToolbar.setAttribute('dir', 'reverse');

        // assign contextual menu to cover entire vertical tab bar
        s.node_tabbrowsertabs.setAttribute('context', 'tabContextMenu');
        s.node_buttons.setAttribute('context', 'tabContextMenu');




        // native overrides
        s.node_tabbrowsertabs._getDropIndex     = s.overrides._getDropIndex;
        s.node_tabbrowsertabs._getDragTargetTab = s.overrides._getDragTargetTab;
        s.node_tabbrowsertabs._animateTabMove   = s.overrides._animateTabMove;




        // detect dom fullscreen (such as video tag) and hide splitter/tabbar
        // no hiding on "regular" browser fullscreen
        window.addEventListener('fullscreen', function(){

            var fs = document.mozFullScreen ? 'true' : 'false';

            this.node_container.setAttribute('collapsed', fs);
            this.node_splitter.setAttribute('collapsed',  fs);

        }.bind(s), false);
    };




    //********************************************************* native overrides
    s.overrides = {};




    //**************** this will put the dragged tab in place of the hovered tab
    // while fixing x/y and width/height
    s.overrides._getDropIndex = function(event) {

        var tabs = this.childNodes;
        var tab  = this._getDragTargetTab(event);

        for(let i=0; i<tabs.length; ++i) {
            if(event.screenY < tabs[i].boxObject.screenY + tabs[i].boxObject.height) {
                if(this.selectedIndex < i) {
                    ++i;
                }
                return i;
            }
        }
        return tabs.length;
    }




    //************************************************* target tab for link drop
    s.overrides._getDragTargetTab = function(event) {

        var tab = event.target.localName == "tab" ? event.target : null;

        if(
            tab
            && (event.type == "drop" || event.type == "dragover")
            && event.dataTransfer.dropEffect == "link"
        ) {

            let boxObject = tab.boxObject;

            if(
                event.screenY < boxObject.screenY + boxObject.height * 0
                || event.screenY > boxObject.screenY + boxObject.height * 1
            ) {
                return null;
            }
        }

        return tab;
    }




    //********************************** skip the animation, just get drop index
    s.overrides._animateTabMove = function(event) {

        // dragged tab
        let draggedTab = event.dataTransfer.mozGetDataAt(TAB_DROP_TYPE, 0);

        // drop index
        let newIndex = spenibus_verticalTabs.node_tabbrowsertabs._getDropIndex(event);

        // set drop index
        draggedTab._dragData.animDropIndex = newIndex;


        // animation: prepare
        let screenY   = event.screenY;
        let tabHeight = draggedTab.getBoundingClientRect().height;
        let pinned    = draggedTab.pinned;
        let numPinned = this.tabbrowser._numPinnedTabs;


        // tabs list
        let tabs = this.tabbrowser.visibleTabs.slice(
            pinned ? 0 : numPinned,
            pinned ? numPinned : undefined
        );


        // from orignal function, seems to reset tabs position when animation is done
        if(this.getAttribute("movingtab") != "true") {
            this.setAttribute("movingtab", "true");
            this.selectedItem = draggedTab;
        }


        // func: get tab shift
        function getTabShift(tab, dropIndex) {
            if(tab._tPos < draggedTab._tPos && tab._tPos >= dropIndex) {
                return tabHeight;
            }
            if(tab._tPos > draggedTab._tPos && tab._tPos < dropIndex) {
                return -tabHeight;
            }
            return 0;
        }


        //*********************************** animation: move tabs to create gap
        for(let tab of tabs) {
            if(tab != draggedTab) {
                let shift = getTabShift(tab, newIndex);
                tab.style.transform = "translateY(" + shift + "px)";
            }
        }


        //****************************************** animation: move dragged tab
        // center dragged tab on mouse
        let tabCenter  = draggedTab.boxObject.screenY + draggedTab.boxObject.height/2;
        let translateY = screenY - tabCenter;

        // translation boundaries
        let translateYmin = tabs[0].boxObject.y             - draggedTab.boxObject.y;
        let translateYmax = tabs[tabs.length-1].boxObject.y - draggedTab.boxObject.y;

        // keep within boundaries
        translateY = Math.max(translateY, translateYmin);
        translateY = Math.min(translateY, translateYmax);

        // move tab
        draggedTab.style.transform = "translateY(" + translateY + "px)";
    }




    // export
    return s;


})();