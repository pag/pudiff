
function PrettyUnifiedDiff(element) {
	this.init(element);
}

PrettyUnifiedDiff.prototype.init = function(element) {
	var text = element.value;
	var hunks = this.parseHunks(text);
	var widget = this.buildWidget(hunks);
	element.parentNode.insertBefore(widget, element);
	element.parentNode.removeChild(element);
}


PrettyUnifiedDiff.prototype.parseHunks = function(text) {
	var lines = text.split(/\r?\n/g);
	var headerRegex = /^@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))?\ @@[ ]?(.*)/;
	var state = '';
	var hunks = [];
	var rows = null;
	var lno = 1;
	var rno = 1;
	for(var i = 0; i < lines.length; ++i) {
		var line = lines[i];
		if(line.length < 1)
			continue;
		var mode = line[0];
		line = line.substring(1);
		if(mode === ' ' || mode == '+' || mode == '-') {
			if(rows == null) {
				throw 'Found diff line but no hunk (@@ ... @@) statement previously';
			}
			if(mode == ' ') {
				rows.push(new DiffRow(lno++, line, rno++, line, mode));
			}
			else if(mode == '+') {
				rows.push(new DiffRow(lno, null, rno++, line, mode));
			}
			else { // mode == '-'
				rows.push(new DiffRow(lno++, line, rno, null, mode));
			}
			
		}
		else if(mode == '@') {
			var bits = headerRegex.exec(line);
			lno = parseInt(bits[1]);
			rno = parseInt(bits[3]);
			rows = [];
			hunks.push(rows);
		}
		else {
			throw 'Unexpected mode "' + mode + '"';
		}
	}
	return hunks;
}

PrettyUnifiedDiff.prototype.buildWidget = function(hunks) {
	function el(tag) {
		var e = document.createElement(tag);
		if(arguments.length > 1) {
			var attrs = arguments[1];
			for(var k in attrs) {
				if(attrs.hasOwnProperty(k)) {
					e.setAttribute(k, attrs[k]);
				}
			}
		}
		if(arguments.length > 2) {
			var children = arguments[2];
			if(Array.isArray && !Array.isArray(children) || !children instanceof Array) {
				children = [children];
			}
			for(var i = 0; i < children.length; ++i) {
				if(typeof children[i] == 'string') {
					e.appendChild(document.createTextNode(children[i]));
				}
				else {
					e.appendChild(children[i]);
				}
			}
		}
		return e;
	}
	
	var tbody = el('tbody');
	for(var i = 0; i < hunks.length; ++i) {
		if(i != 0) {
			tbody.appendChild(el('tr', {'class': 'sep'}, [
				el('td', {'colspan': '4'}, el('div', {}, '...'))
			]));
		}
		for(var j = 0; j < hunks[i].length; ++j) {
			var r = hunks[i][j];
			var mode = r.mode == ' ' ? 'plain' : (r.mode == '+' ? 'add' : 'del');
			tbody.appendChild(el('tr', {'class': mode}, [
				el('td', {'class': 'left number'}, el('span', {}, r.lno + '')),
				el('td', {'class': 'left line'}, el('span', {}, r.left!=null ? r.left : '')),
				el('td', {'class': 'right number'}, el('span', {}, r.rno + '')),
				el('td', {'class': 'right line'}, el('span', {}, r.right!=null ? r.right : ''))
			]));
		}
	}
	return el('table', {'class': 'pretty-udiff'}, tbody);
}





function DiffRow(lno, left, rno, right, mode) {
	this.lno = lno;
	this.left = left;
	this.rno = rno;
	this.right = right;
	this.mode = mode;
}


