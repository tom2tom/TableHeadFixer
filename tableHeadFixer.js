/*!
TableHeadFixer plugin for JQuery
Version 1.0.0
Copyright (C) 2016 Lai Xuancheng <lai32690@gmail.com>
License MIT
*/
(function($,window) { "$:nomunge,window:nomunge";

	$.fn.tableHeadFixer = function(param) {
		var defaults = {
			head: true,
			foot: false,
			left: 0,
			right: 0,
			'z-index': 0
		};
		var settings = $.extend({}, defaults, param);

		return this.each(function() {
			settings.table = this;
			settings.parent = $(this).parent();
			setParent();

			if(settings.head == true)
				fixHead();

			if(settings.foot == true)
				fixFoot();

			if(settings.left > 0)
				fixLeft();

			if(settings.right > 0)
				fixRight();

			setCorner();

			$(settings.parent).trigger("scroll");

			$(window).resize(function() {
				$(settings.parent).trigger("scroll");
			});
		});

		// Setup corner cells where row(s) and column(s) are both fixed
		function setCorner() {
			var collect = null;
			var rows;

			if(settings.head) {
				if(settings.left > 0 || settings.right > 0) {
					rows = $(settings.table).find("thead tr");
					if(rows.length > 0) {
						collect = $();
						if(settings.left > 0) {
							rows.each(function(k, r) {
								solveLeftColspan(r, function(cell) {
									collect = collect.add(cell);
								});
							});
						}
						if(settings.right > 0) {
							rows.each(function(k, r) {
								solveRightColspan(r, function(cell) {
									collect = collect.add(cell);
								});
							});
						}
					}
				}
			}

			if(settings.foot) {
				if(settings.left > 0 || settings.right > 0) {
					rows = $(settings.table).find("tfoot tr");
					if(rows.length > 0) {
						if(!collect) {
							collect = $();
						}
						if(settings.left > 0) {
							rows.each(function(k, r) {
								solveLeftColspan(r, function(cell) {
									collect = collect.add(cell);
								});
							});
						}
						if(settings.right > 0) {
							rows.each(function(k, r) {
								solveRightColspan(r, function(cell) {
									collect = collect.add(cell);
								});
							});
						}
					}
				}
			}
			
			if (collect && collect.length > 0) {
				//how is transparent background reported?
				var ob = $('<div style="background:none;display:none;"/>').appendTo($(settings.parent));
				var transstyle = ob.css('background-color');
				ob.remove();

				collect.each(function(k, cell) {
					ensureBackground(cell, transstyle);
				}).css('z-index', settings['z-index'] + 1);
//				settings.cornercells = collect;
			}
		}

		function ensureBackground(cell, transstyle) {
			for (var current = cell; current != null; current = current.parentElement) {
				var background = $(current).css('background-color');

				if(background && background !== transstyle) {
					if(current != cell) {
						$(cell).css('background-color', background);
					}
					return;
				}
			}
			$(cell).css('background-color', '#FFF');
		}

		// Setup table in parent
		function setParent() {
			var parent = $(settings.parent);
			var table = $(settings.table);

			parent.append(table)
			.css({
				'overflow' : 'auto',
				'overflow-x' : 'auto',
				'overflow-y' : 'auto'
			})
			.scroll(function() {
				var pob = settings.parent;
				var scrollWidth = pob.scrollWidth;
				var clientWidth = pob.clientWidth;
				var scrollHeight = pob.scrollHeight;
				var clientHeight = pob.clientHeight;
				var top = parent.scrollTop();
				var bottom = scrollHeight - clientHeight - top
				var left = parent.scrollLeft();
				var right = scrollWidth - clientWidth - left;

				//TODO support multi-row header
				if(settings.head)
					this.find("thead tr > *").css("top", top);
				//TODO support settings.left > 1
				if(settings.left > 0)
					settings.leftColumns.css("left", left);
				//TODO support settings.right > 1
				if(settings.right > 0)
					settings.rightColumns.css("right", right);
				//TODO support multi-row footer
				if(settings.foot)
					this.find("tfoot tr > *").css("bottom", bottom);
			}
			.bind(table));
		}

		// Setup fixed head
		function fixHead () {
			var cells = $(settings.table).find('thead tr > *');

			cells.css('position', 'relative');
		}

		// Setup fixed foot
		function fixFoot () {
			var cells = $(settings.table).find('tfoot tr > *');

			cells.css('position', 'relative');
		}

		// Setup fixed left column(s)
		function fixLeft () {
			var rows = $(settings.table).find("tr");
			var collect = $();

			rows.each(function(k, r) {
				solveLeftColspan(r, function(cell) {
					collect = collect.add(cell);
				});
			});

			if(collect.length > 0) {
				collect.css('position', 'relative');
				settings.leftColumns = collect;
			}
		}

		// Setup fixed right column(s)
		function fixRight () {
			var rows = $(settings.table).find("tr");
			var collect = $();

			rows.each(function(k, r) {
				solveRightColspan(r, function(cell) {
					collect = collect.add(cell);
				});
			});

			if(collect.length > 0) {
				collect.css('position', 'relative');
				settings.rightColumns = collect;
			}
		}

		function solveLeftColspan(row, action) {
			var fixColumn = settings.left;
			var inc = 1;

			for(var i = 1; i <= fixColumn; i = i + inc) {
				var nth = inc > 1 ? i - 1 : i;

				var cell = $(row).find("> *:nth-child(" + nth + ")");
				var colspan = cell.prop("colspan");

				if (cellPos(cell).left < fixColumn) {
					action(cell);
				}

				inc = colspan;
			}
		}

		function solveRightColspan(row, action) {
			var fixColumn = settings.right;
			var inc = 1;

			for(var i = 1; i <= fixColumn; i = i + inc) {
				var nth = inc > 1 ? i - 1 : i;

				var cell = $(row).find("> *:nth-last-child(" + nth + ")");
				var colspan = cell.prop("colspan");

				action(cell);

				inc = colspan;
			}
		}

		/*
		Get visual position of cell in HTML table (or its block like thead).
		Returns object with "top" and "left" properties set to row and column index of top-left cell corner
		*/
		function cellPos($cell, rescan) {
			var data = $cell.data("cellPos");

			if(!data || rescan) {
				var $table = $cell.closest("table, thead, tbody, tfoot");
				scanTable($table);
				data = $cell.data("cellPos");
			}
			return data;
		}

		function scanTable($table) {
			var m = [];

			$table.children("tr").each(function(y, row) {
				$(row).children("td, th").each(function(x, cell) {
					var $cell = $(cell),
						cspan = $cell.attr( "colspan" ) | 0,
						rspan = $cell.attr( "rowspan" ) | 0,
						tx, ty;
					cspan = cspan ? cspan : 1;
					rspan = rspan ? rspan : 1;
					for(; m[y] && m[y][x]; ++x);  //skip already occupied cells in current row
					for(tx=x; tx < x + cspan; ++tx) {  //mark matrix elements occupied by current cell with true
						for(ty = y; ty < y + rspan; ++ty) {
							if(!m[ty]) {  //fill missing rows
								m[ty] = [];
							}
							m[ty][tx] = true;
						}
					}
					var pos = { top: y, left: x };
					$cell.data("cellPos",pos);
				});
			});
		}
	};
})(jQuery,window);
