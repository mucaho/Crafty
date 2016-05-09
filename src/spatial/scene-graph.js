var Crafty = require('../core/core.js');


Crafty.c("SceneGraph", {
    _parent: null,
    _children: null,

    traverse: function(callback, arg, direction) {
        direction = direction || Infinity;

        // invoke callback; if truthy value is returned abort traversal
        if (callback.call(this, arg))
            return;

        if (direction > 0) {
            this.traverseDown(callback, arg, direction);
        } else if (direction < 0) {
            this.traverseDown(callback, arg, -direction);
        }
    },
    traverseDown: function(callback, arg, direction) {
        direction = direction || Infinity;

        var children;
        if (direction && (children = this._children)) {
            for (var i = 0, l = children.length; i < l; ++i) {
                var child = children[i];
                // invoke callback
                // then, given falsey value returned
                // and child is entity with with SceneGraph methods (e.g. not a polygon)
                if (!callback.call(child, arg) && child.traverse)
                    // recurse into child
                    child.traverse(callback, arg, direction - 1);
            }
        }
    },
    traverseUp: function(callback, arg, direction) {
        direction = direction || Infinity;

        var parent;
        if (direction && (parent = this._parent)) {
            // invoke callback
            // then, given falsey value returned
            // (parent is guaranteed to have SceneGraph component and methods)
            if (!callback.call(parent, arg))
                // recurse into parent
                parent.traverse(callback, arg, direction - 1);
        }
    },

    // when component is removed, detach all children
    // when entity is destroyed, destroy attached children
    remove: function(destroyed) {
        var children = this._children,
            parent = this._parent;

        if (children) {
            var l = children.length;
            while (l--) {
                var child = children[l];

                // delete the child's _parent link, or else the child will splice itself out of
                // this._children while destroying itself (which messes up this for-loop iteration).
                child._parent = null;

                // Destroy child if possible (It's not always possible, e.g. the polygon attached
                // by areaMap has no .destroy(), it will just get garbage-collected.)
                if (destroyed && child.destroy) {
                    child.destroy();
                }
            }
            this._children = null;
        }

        if (parent) {
            parent.detach(this);
        }
    },

    /**@
     * #.attach
     * @comp 2D
     * @sign public this .attach(Entity child[, .., Entity childN])
     * @param child - Child entity(s) to attach
     *
     * Sets one or more entities to be children, with the current entity (`this`)
     * as the parent. When the parent moves or rotates, its children move or
     * rotate by the same amount. (But not vice-versa: If you move a child, it
     * will not move the parent.) When the parent is destroyed, its children are
     * destroyed.
     *
     * For any entity, `this._children` is the array of its children entity
     * objects (if any), and `this._parent` is its parent entity object (if any).
     *
     * As many objects as wanted can be attached, and a hierarchy of objects is
     * possible by attaching.
     */
    attach: function () {
        for (var i = 0, l = arguments.length; i < l; ++i) {
            var child = arguments[i];
            if (child._parent) {
                child._parent.detach(child);
            }
            child._parent = this;
            this._children.push(child);
        }

        return this;
    },

    /**@
     * #.detach
     * @comp 2D
     * @sign public this .detach([Entity child])
     * @param child - The entity to detach. Left blank will remove all attached entities
     *
     * Stop an entity from following the current entity. Passing no arguments will stop
     * every entity attached.
     */
    detach: function (child) {
        var children = this._children;
        if (!children)
            return this;

        var i = 0,
            l = children.length;

        //if nothing passed, remove all attached objects
        if (!child) {
            for (; i < l; ++i) {
                children[i]._parent = null;
            }
            this._children = null;
        }
        //if child passed, find the handler and unbind
        else {
            for (; i < l; ++i) {
                if (children[i] === child) {
                    children.splice(i, 1);
                    child._parent = null;
                }
            }
        }

        return this;
    }
});
