// * Manage a list of items that are children of an html 'div' element

class DocItemList {
    // * Private members:
    #listDiv;
    #allowMultiSelection;

    constructor(divName = 'my-div') {
        this.#listDiv = document.getElementById(divName);
        this.#listDiv.addEventListener("click", this.onListItemClicked.bind(this));
        this.#allowMultiSelection = false;

        // @type {Function}
        this.allowMultiSelection = null;
        // @type {Function}
        this.onDisableAllItemsHandler = null;
        // @type {Function}
        this.onItemAppendHandler = null;
        // @type {Function}
        this.onItemRemovedHandler = null;
        // @type {Function}
        this.onItemSelectedHandler = null;
        // @type {Function}
        this.onItemDeselectedHandler = null;
    }
    
    onListItemClicked(event) {
        let multiSelect = this.#allowMultiSelection /* && event.ctrlKey */ ;
        if (event.target) {
            let itemName = event.target.id;
            let itemIsSelectNone = event.target.classList.contains("display-none-item");
            let noneItemIsSelected = false;
            
            if (itemIsSelectNone) {
                // Clicked the "none" item ==> deselect all others
                const siblings = event.target.parentElement.children;
                for (let li of siblings) {
                    if (!li.classList.contains("display-none-item")) {
                        li.classList.remove("selected");
                        if (this.onItemDeselectedHandler) {
                            this.onItemDeselectedHandler(li.id);
                        }
                    }
                    else {
                        li.classList.add("selected");
                    }
                }
            }
            else if (multiSelect) {
                // Ongoing multiple selection
                if (event.target.classList.contains("selected")) {
                    // Is deselected by current click
                    if (this.onItemDeselectedHandler) {
                        this.onItemDeselectedHandler(itemName);
                    }
                    event.target.classList.remove("selected");
                }
                else {
                    // Is selected by current click
                    if (this.onItemSelectedHandler) {
                        this.onItemSelectedHandler(itemName, false);
                    }
                    event.target.classList.add("selected");
                }
                // Make sure that the "select none" item is deselected
                const siblings = event.target.parentElement.children;
                for (let li of siblings) {
                    if (li.classList.contains("display-none-item")) {
                        li.classList.remove("selected");
                        break;
                    }
                }
            }
            else {
                // Ongoing single selection
                // First, deselect all menu items
                const siblings = event.target.parentElement.children;
                for (let li of siblings) {
                    li.classList.remove("selected");
                    if (!li.classList.contains("display-none-item")) {
                        if (this.onItemDeselectedHandler) {
                            this.onItemDeselectedHandler(li.id);
                        }
                    }
                }
                // Then enable clicked item
                if (!event.target.classList.contains("selected")) {
                    event.target.classList.toggle("selected");
                }
                if (this.onItemSelectedHandler) {
                    this.onItemSelectedHandler(itemName, true);
                }
            }
        }
    }

    // * Public methods:
    addItem(itemId, itemName=itemId, selected=true) {
        if (itemName) {
            // If list is empty, first add a special item for deselecting all list 
            if (this.#allowMultiSelection && !this.#listDiv.children.length) {
                const li = document.createElement('li');
                li.className = "display-none-item";
                li.innerHTML = "- Aucune -";
                this.#listDiv.appendChild(li);
            }
            const li = document.createElement('li');
            li.id = itemId;
            li.innerHTML = itemName;
            if (selected) li.classList = "selected";
            this.#listDiv.appendChild(li);
            if (this.onItemAppendHandler) {
                this.onItemAppendHandler(itemName);
            }
        }
    }

    removeItem(itemId) {
        let item = document.getElementById(itemId);
        if (item && item.parentElement.id == "sailors-div") {
            item.remove();
            if (this.onItemRemovedHandler) {
                this.onItemRemovedHandler(itemId);
            }
        }
    }


    unload() {
        while (this.#listDiv.firstChild) {
            this.#listDiv.removeChild(this.#listDiv.firstChild)
        }
    }

    /**
      @param {Function}
     */
    set allowMultiSelection(status) {
        this.#allowMultiSelection = status;
    }

    /**
      @param {Function} handler
     */
    set onDisableAll(handler) {
        this.onDisableAllItemsHandler = handler;
    }

    /**
      @param {Function} handler
     */
    set onItemAppend(handler) {
        this.onItemAppendHandler = handler;
    }

    /**
      @param {Function} handler
     */
    set onItemRemoved(handler) {
        this.onItemRemovedHandler = handler;
    }

    /**
      @param {Function} handler
     */
    set onItemSelected(handler) {
        this.onItemSelectedHandler = handler;
    }

    /**
      @param {Function} handler
     */
    set onItemDeselected(handler) {
        this.onItemDeselectedHandler = handler;
    }

}

export default DocItemList;