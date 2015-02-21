/* global define */

define(function (require, exports, module) {
    "use strict";

    var acorn = require("src/external/acorn_loose");

    function _getVisibilityClass(name) {
        if (name === "function") {
            return " outline-entry-js-unnamed";
        }
        return " outline-entry-js-" + (name[0] === "_" ? "private" : "public");
    }

    function _createListEntry(name, args, line, ch, indent) {
        var $elements = [];
        if (indent) {
            var $indentation = $(document.createElement("span"));
            $indentation.addClass("outline-entry-js-indent");
            var interpunct = "";
            for (var i = 0; i < indent; i++) {
                interpunct += "·";
            }
            $indentation.text(interpunct);
            $elements.push($indentation);
        }
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-js-name");
        $name.text(name);
        $elements.push($name);
        var $arguments = $(document.createElement("span"));
        $arguments.addClass("outline-entry-js-arg");
        $arguments.text(args);
        $elements.push($arguments);
        return {
            name: name,
            line: line,
            ch: ch,
            classes: "outline-entry-js outline-entry-icon" + _getVisibilityClass(name),
            $html: $elements
        };
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {Array}   lines         Array that contains the lines of text.
     * @param   {Boolean} showArguments args Preference.
     * @param   {Boolean} showUnnamed   unnamed Preference.
     * @returns {Array}   List of outline entries.
     */
    function getOutlineList(lines, showArguments, showUnnamed) {
        var regex;
        if (showArguments) {
            regex = /((\w*)\s*[=:]\s*)?function(\s*|\s+\w*\s*)(\([\w,\s,\$,\_]*\))/g;
        } else {
            regex = /((\w*)\s*[=:]\s*)?function(\s*|\s+\w*\s*)()\(/g;
        }

        var result = [];
        function _parseLine(line, index, level) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[3].trim() || match[2] || "").trim();
                var args = (match[4] || "");
                match = regex.exec(line);
                if (name.length === 0) {
                    if (showUnnamed) {
                        name = "function";
                    } else {
                        continue;
                    }
                }
                result.push(_createListEntry(name, args, index, line.length, level));
            }
        }

        function _traverseAst(tree, level) {
            if(/Function(Expression|Declaration)/.test(tree.type)) {
                var index = tree.loc.start.line - 1;
                _parseLine(lines[index], index, level);
                level++;
            }
            for(var prop in tree) {
                if (tree[prop] && typeof(tree[prop]) === "object") {
                    _traverseAst(tree[prop], level);
                }
            }
        }

        var tree = acorn.parse_dammit(lines.join("\n"), {
            locations   : true,
            ranges      : false,
            ecmaVersion : 6
        });
        _traverseAst(tree, 0);
        return result;
    }

    function compare(a, b) {
        if (b.name === "function") {
            return -1;
        }
        if (a.name === "function") {
            return 1;
        }
        if (a.name > b.name) {
            return 1;
        }
        if (a.name < b.name) {
            return -1;
        }
        return 0;
    }

    module.exports = {
        getOutlineList: getOutlineList,
        compare: compare
    };
});
