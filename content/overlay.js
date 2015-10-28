/******************************************************************************/
spenibus_verticalTabs = {


    /***************************************************************************/
    init : function() {

        // update gui to show vertical tab bar
        spenibus_verticalTabs.windowUpdate();

        // remove init listener
        window.removeEventListener('load', spenibus_verticalTabs.init, false);
    },




    /***************************************************************************/
    windowUpdate : function() {

        // addon elements
        this.node_container     = document.getElementById('spenibus_verticalTabs_container');
        this.node_buttons       = document.getElementById('spenibus_verticalTabs_buttons');
        this.node_closeButton   = document.getElementById('spenibus_verticalTabs_closeButton');
        this.node_splitter      = document.getElementById('spenibus_verticalTabs_splitter');

        // native elements
        this.node_tabsToolbar    = document.getElementById('TabsToolbar');
        this.node_tabbrowsertabs = document.getElementById('tabbrowser-tabs');

        // native buttons
        this.node_newtabbutton  = document.getElementById('new-tab-button');
        this.node_alltabsbutton = document.getElementById('alltabs-button');


        // group buttons horizontally
        this.node_buttons.appendChild(this.node_alltabsbutton);
        this.node_buttons.appendChild(this.node_newtabbutton);
        this.node_buttons.appendChild(this.node_closeButton);

        // move buttons holder inside tabs toolbar
        this.node_tabbrowsertabs.parentNode.insertBefore(
            this.node_buttons,
            this.node_tabbrowsertabs.nextSibling
        );


        // put tab bar in vertical box
        this.node_container.appendChild(this.node_tabsToolbar);

        // orient tab strip vertically
        this.node_tabbrowsertabs.mTabstrip.setAttribute('orient', 'vertical');

        // make tabs toolbar fill its container
        this.node_tabsToolbar.setAttribute('flex', '1');

        // orient tabs toolbar vertically
        this.node_tabsToolbar.setAttribute('orient', 'vertical');

        // reverse elements order within tabs toolbar
        this.node_tabsToolbar.setAttribute('dir', 'reverse');

        // assign contextual menu to cover entire vertical tab bar
        this.node_tabbrowsertabs.setAttribute('context', 'tabContextMenu');
        this.node_buttons.setAttribute('context', 'tabContextMenu');


        // native override: this will put the dragged tab in place of the hovered tab (also x/y width/height)
        this.node_tabbrowsertabs._getDropIndex = function(event) {

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


        // native override: target tab for link drop
        this.node_tabbrowsertabs._getDragTargetTab = function(event) {

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




        // native override: -------------skip the animation, just get drop index
        this.node_tabbrowsertabs._animateTabMove = function(event) {

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


            //********************************** animation: move tabs to create gap
            for(let tab of tabs) {
                if(tab != draggedTab) {
                    let shift = getTabShift(tab, newIndex);
                    tab.style.transform = "translateY(" + shift + "px)";
                }
            }


            //***************************************** animation: move dragged tab
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




        // detect dom fullscreen (such as video tag) and hide splitter/tabbar
        // no hiding on "regular" browser fullscreen
        window.addEventListener('fullscreen', function(){

            var fs = document.mozFullScreen ? 'true' : 'false';

            this.node_container.setAttribute('collapsed', fs);
            this.node_splitter.setAttribute('collapsed', fs);

        }.bind(this), false);
    },




    /***************************************************************************/
    showHide : function() {

        var hidden = !this.node_container.hidden;

        this.node_container.hidden = hidden;
        this.node_splitter.hidden  = hidden;
    },


};




/**************************************************************** run on load */
window.addEventListener('load', spenibus_verticalTabs.init, false);