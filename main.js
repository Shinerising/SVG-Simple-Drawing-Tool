let nodeActive, pinActive, pinParent;
let originalPosition, originalMousePosition;
let selectBox = {},
    selectActive;
let moveBox = {},
    moveOriginalBox = {},
    moveActive,
    moveList,
    movePositionList;
let download = (filename, text, format) => {
    var element = document.createElement('a');
    element.setAttribute('href', format + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

let desList = [];
let pushList = [];
let pushHelper = {};
let pushInterval;

let scaleFactor = 1;
let canvasTitle = "未命名";

let global = {
    canvasTitle: "未命名",
    canvasAuthor: "作者名称",
    canvasDescrip: "",
    canvasWidth: 2400,
    canvasHeight: 1600,
    canvasBackground: "FFFFFF",
    canvasStrokeColor: "000000",
    lineStroke: 3,
    polygonStroke: 3,
    mouseStep: 10,
    gridSize: 20,
};
let cfgSet, cfgHlpSet;
let config = {
    tabs: ["文档设置", "工作设置"],
    type: 'global',
    frames: [{
        canvasTitle: "未命名",
        canvasAuthor: "作者名称",
        canvasDescrip: "",
        canvasWidth: 2400,
        canvasHeight: 1600,
        canvasBackground: "FFFFFF",
        canvasStrokeColor: "000000",
        lineStroke: 3,
        polygonStroke: 3
    }, {
        mouseStep: 10,
        gridSize: 20
    }]
};

let configHelper = {
    canvasTitle: {
        name: "文档名称",
        action: "input",
        type: "string",
        pattern: ''
    },
    canvasAuthor: {
        name: "文档作者",
        action: "input",
        type: "string",
        pattern: ''
    },
    canvasDescrip: {
        name: "文档简介",
        action: "input",
        type: "string",
        pattern: '',
        full: true
    },
    canvasWidth: {
        name: "画布宽度",
        action: "input",
        type: "int",
        pattern: '[1-9][0-9]{0,3}'
    },
    canvasHeight: {
        name: "画布高度",
        action: "input",
        type: "int",
        pattern: '[1-9][0-9]{0,3}'
    },
    canvasBackground: {
        name: "画布背景颜色",
        action: "input",
        type: "color",
        pattern: ''
    },
    canvasStrokeColor: {
        name: "画笔颜色",
        action: "input",
        type: "color",
        pattern: ''
    },
    lineStroke: {
        name: "线条宽度",
        action: "input",
        type: "int",
        pattern: '[1-9]'
    },
    polygonStroke: {
        name: "多边形线条宽度",
        action: "input",
        type: "int",
        pattern: '[1-9]'
    },
    mouseStep: {
        name: "鼠标步长",
        action: "select",
        type: "int",
        select: [5, 10, 20, 40]
    },
    gridSize: {
        name: "网格大小",
        action: "select",
        type: "int",
        select: [10, 20, 40]
    }
};

let setSettings = (cfg, cfgHlp) => {
    cfgSet = cfg;
    cfgHlpSet = cfgHlp;
    let form = $('.setting-form');
    form.empty();
    let tabs = $('<div>').addClass('setting-tablist');
    cfg.tabs.forEach((n) => {
        $('<div>')
            .addClass('setting-tab')
            .text(n)
            .appendTo(tabs)
            .click((e) => {
                let obj = $(e.currentTarget);
                if (!obj.hasClass('active')) {
                    $('.setting-tab').removeClass('active');
                    obj.addClass('active');
                    $('.setting-frame').hide();
                    $('.setting-frame').eq(obj.index()).show();
                }
            });
    });
    tabs.find('.setting-tab').eq(0).addClass('active');
    form.append(tabs);
    cfg.frames.forEach((n) => {
        let frames = $('<div>').addClass('setting-frame');
        for (let key in n) {
            if (!cfgHlp[key]) {
                break;
            }
            if (cfgHlp[key].action === "input" && cfgHlp[key].type === "string") {
                frames.append('<div class="setting-item"><label>' + cfgHlp[key].name + '</label><div><input id="' + key + '" type="text" value="' + n[key] + '" pattern="' + (cfgHlp[key].pattern || '') + '"></div></div>');
            } else if (cfgHlp[key].action === "input" && cfgHlp[key].type === "color") {
                frames.append('<div class="setting-item"><label>' + cfgHlp[key].name + '</label><div style="color:#' + n[key] + '"><i>#</i><input id="' + key + '" type="color" value="' + n[key] + '" pattern="' + (cfgHlp[key].pattern || '') + '"><i>●</i></div></div>');
            } else if (cfgHlp[key].action === "input") {
                frames.append('<div class="setting-item"><label>' + cfgHlp[key].name + '</label><div><input id="' + key + '" type="number" value="' + n[key] + '" pattern="' + (cfgHlp[key].pattern || '') + '"></div></div>');
            } else if (cfgHlp[key].action === "select") {
                let slt = $('<select>').append().val(n[key]);
                frames.append('<div class="setting-item"><label>' + cfgHlp[key].name + '</label><div><select id="' + key + '">' +
                    cfgHlp[key].select.reduce((res, node) => res + '<option value="' + node + '">' + node + '</option>', '') +
                    '</select></div></div>');
                frames.find('select').last().val(n[key]);
            }
            if (cfgHlp[key].full) {
                frames.find('.setting-item').last().addClass('full');
            }
            frames.find('input[type="color"]').on('input', (e) => {
                $(e.currentTarget).parent().css("color", "#" + $(e.currentTarget).val());
            });
        }
        form.append(frames);
    });
};

let rem = () => {
    var html = document.getElementsByTagName('html')[0];
    return parseInt(window.getComputedStyle(html)['fontSize']);
};

let checkInside = (points, box) => {
    for (let i = 0; i < points.length; i += 1) {
        let p = points[i];
        let x = p[0] * $('svg.canvas').width() / global.canvasWidth;
        let y = p[1] * $('svg.canvas').height() / global.canvasHeight;
        if (x <= box.x || x >= box.w) {
            return false;
        }
        if (y <= box.y || y >= box.z) {
            return false;
        }
    }
    return true;
}

let fixMenuPosition = (menu) => {
    let rect = menu[0].getBoundingClientRect();
    let offsetX = $(window).width() - rect.left - menu.width() - rem() * 0.5;
    let offsetY = $(window).height() - rect.top - menu.height() - rem() * 0.5;
    let offset = menu.offset();
    if (offsetX < 0) {
        offset.left += offsetX;
        menu.addClass('near-right');
    }
    if (offsetY < 0) {
        offset.top += offsetY;
        menu.addClass('near-bottom');
    }
    menu.offset(offset);
};

let refreshNode = (node) => {
    let x, y;
    if (node.data('type') === 'line' || node.data('type') === 'dashline') {
        let cx1, cy1, cx2, cy2;
        x = parseInt(node.attr('data-x'));
        y = parseInt(node.attr('data-y'));
        cx1 = parseInt(node.find('circle[data-id="1"]').attr('cx'));
        cy1 = parseInt(node.find('circle[data-id="1"]').attr('cy'));
        cx2 = parseInt(node.find('circle[data-id="2"]').attr('cx'));
        cy2 = parseInt(node.find('circle[data-id="2"]').attr('cy'));
        node.find('path').attr('d', `m${cx1} ${cy1} l${cx2-cx1} ${cy2-cy1}`);
    } else if (node.data('type') === 'polyline') {
        let cx1, cy1, cx2, cy2;
        x = parseInt(node.attr('data-x'));
        y = parseInt(node.attr('data-y'));
        cx1 = parseInt(node.find('circle[data-id="1"]').attr('cx'));
        cy1 = parseInt(node.find('circle[data-id="1"]').attr('cy'));
        cx2 = parseInt(node.find('circle[data-id="2"]').attr('cx'));
        cy2 = parseInt(node.find('circle[data-id="2"]').attr('cy'));
        if (node.attr('data-direction') === 'v') {
            node.find('path').attr('d', `m${cx1} ${cy1} l0 ${cy2-cy1} l${cx2-cx1} 0`);
            if (cx1 < cx2) {
                node.find('polygon').attr('points', `${cx2-5},${cy2-5} ${cx2-5},${cy2+5} ${cx2+5},${cy2}`);
            } else if (cx1 > cx2) {
                node.find('polygon').attr('points', `${cx2+5},${cy2-5} ${cx2+5},${cy2+5} ${cx2-5},${cy2}`);
            } else if (cy1 > cy2) {
                node.find('polygon').attr('points', `${cx2-5},${cy2-5} ${cx2+5},${cy2-5} ${cx2},${cy2+5}`);
            } else if (cy1 < cy2) {
                node.find('polygon').attr('points', `${cx2-5},${cy2+5} ${cx2+5},${cy2+5} ${cx2},${cy2-5}`);
            } else {
                node.find('polygon').attr('points', ``);
            }
        } else {
            node.find('path').attr('d', `m${cx1} ${cy1} l${cx2-cx1} 0 l0 ${cy2-cy1}`);
            if (cy1 < cy2) {
                node.find('polygon').attr('points', `${cx2-5},${cy2-5} ${cx2+5},${cy2-5} ${cx2},${cy2+5}`);
            } else if (cy1 > cy2) {
                node.find('polygon').attr('points', `${cx2-5},${cy2+5} ${cx2+5},${cy2+5} ${cx2},${cy2-5}`);
            } else if (cx1 > cx2) {
                node.find('polygon').attr('points', `${cx2+5},${cy2-5} ${cx2+5},${cy2+5} ${cx2-5},${cy2}`);
            } else if (cx1 < cx2) {
                node.find('polygon').attr('points', `${cx2-5},${cy2-5} ${cx2-5},${cy2+5} ${cx2+5},${cy2}`);
            } else {
                node.find('polygon').attr('points', ``);
            }
        }
    } else if (node.data('type') === 'multipolyline') {
        let cx1, cy1, cx2, cy2;
        x = parseInt(node.attr('data-x'));
        y = parseInt(node.attr('data-y'));
        cx1 = parseInt(node.find('circle[data-id="1"]').attr('cx'));
        cy1 = parseInt(node.find('circle[data-id="1"]').attr('cy'));
        cx2 = parseInt(node.find('circle[data-id="2"]').attr('cx'));
        cy2 = parseInt(node.find('circle[data-id="2"]').attr('cy'));
        cx3 = parseInt(node.find('circle[data-id="3"]').attr('cx'));
        cy3 = parseInt(node.find('circle[data-id="3"]').attr('cy'));
        if (node.attr('data-direction') === 'v') {
            node.find('path').attr('d', `m${cx1} ${cy1} l0 ${cy2-cy1} l${cx3-cx1} 0 l0 ${cy3-cy2}`);
            cx2 = (cx3 + cx1) / 2;
            node.find('circle[data-id="2"]').attr('cx', cx2);
            if (cy2 < cy3) {
                node.find('polygon').attr('points', `${cx3-5},${cy3-5} ${cx3+5},${cy3-5} ${cx3},${cy3+5}`);
            } else if (cy2 > cy3) {
                node.find('polygon').attr('points', `${cx3-5},${cy3+5} ${cx3+5},${cy3+5} ${cx3},${cy3-5}`);
            } else if (cx2 > cx3) {
                node.find('polygon').attr('points', `${cx3-5},${cy3-5} ${cx3-5},${cy3+5} ${cx3+5},${cy3}`);
            } else if (cx2 < cx3) {
                node.find('polygon').attr('points', `${cx3+5},${cy3-5} ${cx3+5},${cy3+5} ${cx3-5},${cy3}`);
            } else {
                node.find('polygon').attr('points', ``);
            }
        } else {
            node.find('path').attr('d', `m${cx1} ${cy1} l${cx2-cx1} 0 l0 ${cy3-cy1} l${cx3-cx2} 0`);
            cy2 = (cy3 + cy1) / 2;
            node.find('circle[data-id="2"]').attr('cy', cy2);
            if (cx2 < cx3) {
                node.find('polygon').attr('points', `${cx3-5},${cy3-5} ${cx3-5},${cy3+5} ${cx3+5},${cy3}`);
            } else if (cx2 > cx3) {
                node.find('polygon').attr('points', `${cx3+5},${cy3-5} ${cx3+5},${cy3+5} ${cx3-5},${cy3}`);
            } else if (cy2 > cy3) {
                node.find('polygon').attr('points', `${cx3-5},${cy3+5} ${cx3+5},${cy3+5} ${cx3},${cy3-5}`);
            } else if (cy2 < cy3) {
                node.find('polygon').attr('points', `${cx3-5},${cy3-5} ${cx3+5},${cy3-5} ${cx3},${cy3+5}`);
            } else {
                node.find('polygon').attr('points', ``);
            }
        }
    } else if (node.data('type') === 'rectangle' || node.data('type') === 'dashrectangle' || node.data('type') === 'roundrectangle') {
        let cx1, cy1, cx2, cy2;
        x = parseInt(node.attr('data-x'));
        y = parseInt(node.attr('data-y'));
        cx1 = parseInt(node.find('circle[data-id="1"]').attr('cx'));
        cy1 = parseInt(node.find('circle[data-id="1"]').attr('cy'));
        cx2 = parseInt(node.find('circle[data-id="2"]').attr('cx'));
        cy2 = parseInt(node.find('circle[data-id="2"]').attr('cy'));
        if (cx2 - cx1 < 0) {
            cx2 = cx1 + cx2;
            cx1 = cx2 - cx1;
            cx2 = cx2 - cx1;
        }
        if (cy2 - cy1 < 0) {
            cy2 = cy1 + cy2;
            cy1 = cy2 - cy1;
            cy2 = cy2 - cy1;
        }
        node.find('rect').attr('x', `${cx1}`);
        node.find('rect').attr('y', `${cy1}`);
        node.find('rect').attr('width', `${cx2-cx1}`);
        node.find('rect').attr('height', `${cy2-cy1}`);
    } else if (node.data('type') === 'ellipse') {
        let cx1, cy1, cx2, cy2;
        x = parseInt(node.attr('data-x'));
        y = parseInt(node.attr('data-y'));
        cx1 = parseInt(node.find('circle[data-id="1"]').attr('cx'));
        cy1 = parseInt(node.find('circle[data-id="1"]').attr('cy'));
        cx2 = parseInt(node.find('circle[data-id="2"]').attr('cx'));
        cy2 = parseInt(node.find('circle[data-id="2"]').attr('cy'));
        if (cx2 - cx1 < 0) {
            cx2 = cx1 + cx2;
            cx1 = cx2 - cx1;
            cx2 = cx2 - cx1;
        }
        if (cy2 - cy1 < 0) {
            cy2 = cy1 + cy2;
            cy1 = cy2 - cy1;
            cy2 = cy2 - cy1;
        }
        node.find('ellipse').attr('cx', `${(cx1+cx2)/2}`);
        node.find('ellipse').attr('cy', `${(cy1+cy2)/2}`);
        node.find('ellipse').attr('rx', `${(cx2-cx1)/2}`);
        node.find('ellipse').attr('ry', `${(cy2-cy1)/2}`);
    } else if (node.data('type') === 'diamond') {
        let cx1, cy1, cx2, cy2, cx, cy;
        x = parseInt(node.attr('data-x'));
        y = parseInt(node.attr('data-y'));
        cx1 = parseInt(node.find('circle[data-id="1"]').attr('cx'));
        cy1 = parseInt(node.find('circle[data-id="1"]').attr('cy'));
        cx2 = parseInt(node.find('circle[data-id="2"]').attr('cx'));
        cy2 = parseInt(node.find('circle[data-id="2"]').attr('cy'));
        cx = (cx1 + cx2) / 2;
        cy = (cy1 + cy2) / 2;
        node.find('polygon').attr('points', `${cx},${cy1} ${cx1},${cy} ${cx},${cy2} ${cx2},${cy}`);
    }
}

let setListeners = (node) => {
    node.dblclick((e) => {
        if ($(e.target).is('text')) {
            let obj = $(e.target);
            let input = $('<input type="text">').addClass('text-edit');
            let x = (e.pageX - $('svg.canvas').offset().left) + $(window).scrollLeft();
            let y = (e.pageY - $('svg.canvas').offset().top) + $(window).scrollTop();
            $('.workarea').append(input);
            input.css('left', x + 'px');
            input.css('top', y + 'px');
            input.val(obj.text());
            input.bind('input', {}, () => {
                obj.text(input.val());
            });
            input.bind("keydown", {}, (e) => {
                let code = (e.KeyCode ? e.KeyCode : e.which);
                if (code === 13) {
                    if (obj.text().length === 0) {
                        obj.text('000');
                    }
                    input.remove();

                }
            });
            input.focus();
            input.select();
            input.focusout(() => {
                if (obj.text().length === 0) {
                    obj.text('000');
                }
                input.remove();
            });
        } else {
            let obj = $(e.currentTarget);
            if (obj.data('type') === 'junction') {
                if (obj.attr('data-active') === '1') {
                    obj.attr('data-active', '0');
                } else {
                    obj.attr('data-active', '1');
                }
            } else if (obj.data('type') === 'junction-x') {
                let n = $(e.target);
                if (!n.attr('data-id')) {
                    return;
                }
                let state = n.attr('data-active') === '1' ? '0' : '1';
                obj.find('[data-id="' + n.attr('data-id') + '"]').attr('data-active', state);
            }
        }
    });

    node.contextmenu((e) => {
        $('.node-menu').remove();
        let obj = $(e.currentTarget);
        let menuStr = '.menu-' + obj.data('type');
        if ($(menuStr).length === 0) {
            return;
        }
        let menu = $('<div type="text" />').addClass('node-menu');
        menu.append($(menuStr).clone());
        let x = (e.pageX - $('svg.canvas').offset().left) + $(window).scrollLeft() - 5;
        let y = (e.pageY - $('svg.canvas').offset().top) + $(window).scrollTop() - 5;
        menu.css('left', x + 'px');
        menu.css('top', y + 'px');
        menu.click((e) => {
            if ($(e.target).data('action') === 0) {
                obj.remove();
            } else if ($(e.target).data('action') === 301 || $(e.target).data('action') === 401) {
                if (obj.attr('data-direction') === 'v') {
                    obj.attr('data-direction', 'h');
                    refreshNode(obj);
                } else {
                    obj.attr('data-direction', 'v');
                    refreshNode(obj);
                }
            } else if ($(e.target).data('action') === 302 || $(e.target).data('action') === 402) {
                if (obj.attr('data-dash') === 'true') {
                    obj.attr('data-dash', 'false');
                    refreshNode(obj);
                } else {
                    obj.attr('data-dash', 'true');
                    refreshNode(obj);
                }
            } else if ($(e.target).data('action') === 303 || $(e.target).data('action') === 403) {
                if (obj.attr('data-arrow') === 'true') {
                    obj.attr('data-arrow', 'false');
                    refreshNode(obj);
                } else {
                    obj.attr('data-arrow', 'true');
                    refreshNode(obj);
                }
            } else if ($(e.target).data('action') === 701) {
                obj.find('rect').attr('rx', 10);
                obj.find('rect').attr('ry', 10);
            } else if ($(e.target).data('action') === 702) {
                obj.find('rect').attr('rx', 20);
                obj.find('rect').attr('ry', 20);
            } else if ($(e.target).data('action') === 703) {
                obj.find('rect').attr('rx', 40);
                obj.find('rect').attr('ry', 40);
            } else if ($(e.target).data('action') === 1001 || $(e.target).data('action') === 1101 || $(e.target).data('action') === 1201 || $(e.target).data('action') === 1301) {
                obj.attr('data-color', '');
            } else if ($(e.target).data('action') === 1002 || $(e.target).data('action') === 1102 || $(e.target).data('action') === 1202 || $(e.target).data('action') === 1302) {
                obj.attr('data-color', 'green');
            } else if ($(e.target).data('action') === 1003 || $(e.target).data('action') === 1103 || $(e.target).data('action') === 1203 || $(e.target).data('action') === 1303) {
                obj.attr('data-color', 'red');
            } else if ($(e.target).data('action') === 1004 || $(e.target).data('action') === 1104 || $(e.target).data('action') === 1204 || $(e.target).data('action') === 1304) {
                obj.attr('data-color', 'gray');
            } else if ($(e.target).data('action') === 1005 || $(e.target).data('action') === 1105 || $(e.target).data('action') === 1205 || $(e.target).data('action') === 1305) {
                obj.attr('data-font', '16');
            } else if ($(e.target).data('action') === 1006 || $(e.target).data('action') === 1106 || $(e.target).data('action') === 1206 || $(e.target).data('action') === 1306) {
                obj.attr('data-font', '20');
            } else if ($(e.target).data('action') === 1007 || $(e.target).data('action') === 1107 || $(e.target).data('action') === 1207 || $(e.target).data('action') === 1307) {
                obj.attr('data-font', '24');
            } else if ($(e.target).data('action') === 1008 || $(e.target).data('action') === 1108 || $(e.target).data('action') === 1208 || $(e.target).data('action') === 1308) {
                obj.attr('data-font', '28');
            }
            menu.remove();
        });
        $('.workarea').append(menu);
        e.preventDefault();
        fixMenuPosition(menu);
    });

    node.mouseenter((e) => {
        $('.info-panel').text($(e.currentTarget).data('name'));
    });

    node.mouseleave((e) => {
        $('.info-panel').text('');
    });

    node.mousedown((e) => {
        if (nodeActive || pinActive || e.which !== 1) {
            return;
        } else if ($(e.target).is('circle.g-pin')) {
            pinActive = $(e.target);
            pinParent = $(e.currentTarget);
            let x = (e.pageX - $('svg.canvas').offset().left) + $(window).scrollLeft();
            let y = (e.pageY - $('svg.canvas').offset().top) + $(window).scrollTop();
            originalMousePosition = {
                x,
                y
            };
            x = parseInt(pinActive.attr('cx'));
            y = parseInt(pinActive.attr('cy'));
            originalPosition = {
                x,
                y
            };
        } else {
            nodeActive = $(e.currentTarget);
            let x = (e.pageX - $('svg.canvas').offset().left) + $(window).scrollLeft();
            let y = (e.pageY - $('svg.canvas').offset().top) + $(window).scrollTop();
            originalMousePosition = {
                x,
                y
            };
            x = parseInt(nodeActive.attr('data-x'));
            y = parseInt(nodeActive.attr('data-y'));
            originalPosition = {
                x,
                y
            };
        }
    });

    node.mouseup((e) => {
        nodeActive = undefined;
        pinActive = undefined;
    });
};

$(document).ready(() => {

    $(window).click(() => {
        $('.node-menu').remove();
    });

    $('.control-title').dblclick((e) => {
        let obj = $('.control-title');
        let input = $('.title-edit');
        input.show();
        input.val(obj.text());
        input.bind('input', {}, () => {
            canvasTitle = input.val();
            obj.text(canvasTitle);
            $('.canvas-title').text(canvasTitle);
        });
        input.bind("keydown", {}, (e) => {
            let code = (e.KeyCode ? e.KeyCode : e.which);
            if (code === 13) {
                if (obj.text().length === 0) {
                    canvasTitle = '未命名';
                    obj.text(canvasTitle);
                    $('.canvas-title').text(canvasTitle);
                }
                input.hide();
            }
        });
        input.focus();
        input.select();
        input.focusout(() => {
            if (obj.text().length === 0) {
                canvasTitle = '未命名';
                obj.text(canvasTitle);
                $('.canvas-title').text(canvasTitle);
            }
            input.hide();
        });
    });

    $('.button.fullscreen').click(() => {
        if (document.webkitFullscreenEnabled) {
            document.body.webkitRequestFullscreen();
        } else {
            if (document.body.webkitCancelFullscreen) {
                document.body.webkitCancelFullscreen();
            }
        }
    });

    $('.button.download.d-svg').click(() => {
        download(canvasTitle + '.svg', $('svg.canvas')[0].outerHTML, 'data:text/plain;charset=utf-8,');
    });

    $('.button.download.d-png').click(() => {
        window.open("./getpng.html", "_blank");
    });

    $('.button.download.d-pdf').click(() => {
        window.open("./getpdf.html", "_blank");
    });

    $('.button.zoom.z-out').click(() => {
        scaleFactor += 0.1;
        if (scaleFactor > 2) {
            scaleFactor = 2
        }
        $('.workarea').css('font-size', scaleFactor * 12 + 'px');
    });

    $('.button.zoom.z-in').click(() => {
        scaleFactor -= 0.1;
        if (scaleFactor < 0.5) {
            scaleFactor = 0.5
        }
        $('.workarea').css('font-size', scaleFactor * 12 + 'px');
    });

    $('.button.read-file').click(() => {
        $('#file-input').click();
    });

    $('#file-input').bind('change', {}, (e) => {
        var file = e.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            let contents = e.target.result;
            e.target.files = [];
            $('.workarea').html(contents);
            canvasTitle = $('.workarea').find('title').text() || '未命名';
            $('.control-title').text(canvasTitle);
            $('.workarea').find('g.draw').each((idx, n) => {
                setListeners($(n));
            });
        };
        reader.readAsText(file);
    });

    $('.tool.add').mousedown((e) => {
        if (nodeActive && e.which !== 1) {
            return;
        }
        let obj = $(e.currentTarget);
        let node = $('#' + obj.data('type'));
        if (node.length !== 0) {
            node = node.clone();
        } else {
            return;
        }
        node.removeAttr('id');

        setListeners(node);

        nodeActive = node;
        let x = (e.pageX - $('svg.canvas').offset().left) + $(window).scrollLeft();
        let y = (e.pageY - $('svg.canvas').offset().top) + $(window).scrollTop();

        let offsetX = x / $('svg.canvas').width() * global.canvasWidth;
        let offsetY = y / $('svg.canvas').height() * global.canvasHeight;

        offsetX = Math.round(offsetX / global.mouseStep) * global.mouseStep - global.mouseStep;
        offsetY = Math.round(offsetY / global.mouseStep) * global.mouseStep - global.mouseStep;
        nodeActive.attr('transform', 'translate(' + offsetX + ',' + offsetY + ')');
        nodeActive.data('x', offsetX);
        nodeActive.data('y', offsetY);

        originalMousePosition = {
            x,
            y
        };
        originalPosition = {
            x: offsetX,
            y: offsetY
        };

        $('svg.canvas').append(node);
    });

    $('.main').contextmenu((e) => {
        if (!$(e.target).is('svg') && !$(e.target).is('div')) {
            return;
        }
        $('.node-menu').remove();
        let obj = $(e.currentTarget);
        let menu = $('<div type="text" />').addClass('node-menu');
        menu.append($('.menu-canvas').clone());
        let x = (e.pageX - $('svg.canvas').offset().left) + $(window).scrollLeft() - 5;
        let y = (e.pageY - $('svg.canvas').offset().top) + $(window).scrollTop() - 5;
        menu.css('left', x + 'px');
        menu.css('top', y + 'px');
        menu.click((e) => {
            if ($(e.target).data('action') === 1) {
                let box = {
                    x: 0,
                    y: 0,
                    w: $('svg.canvas').width(),
                    z: $('svg.canvas').height(),
                };
                $('svg.canvas g.draw').each((idx, n) => {
                    let obj = $(n);
                    let points = [];
                    let x = parseInt(obj.attr('data-x'));
                    let y = parseInt(obj.attr('data-y'));
                    points.push([x, y]);
                    if (obj.find('circle[data-id="1"]').length > 0) {
                        points.push([parseInt(obj.find('circle[data-id="1"]').attr('cx')) + x, parseInt(obj.find('circle[data-id="1"]').attr('cy')) + y]);
                    }
                    if (obj.find('circle[data-id="2"]').length > 0) {
                        points.push([parseInt(obj.find('circle[data-id="2"]').attr('cx')) + x, parseInt(obj.find('circle[data-id="2"]').attr('cy')) + y]);
                    }
                    if (obj.find('circle[data-id="3"]').length > 0) {
                        points.push([parseInt(obj.find('circle[data-id="3"]').attr('cx')) + x, parseInt(obj.find('circle[data-id="3"]').attr('cy')) + y]);
                    }
                    if (!checkInside(points, box)) {
                        obj.remove();
                    }
                });
            } else if ($(e.target).data('action') === 3) {
                setSettings(config, configHelper);
                $('.setting-panel').attr('style', '');
                $('.setting-panel').show();
            } else if ($(e.target).data('action') === 4) {
                $('svg.canvas g.draw').remove();
            } else if ($(e.target).data('action') === 5) {
                location.reload();
            } else if ($(e.target).data('action') === 6) {
                $('.button.read-file').click();
            } else if ($(e.target).data('action') === 7) {
                $('.button.d-svg').click();
            } else if ($(e.target).data('action') === 8) {
                $('.button.d-png').click();
            } else if ($(e.target).data('action') === 9) {
                $('.button.d-pdf').click();
            }
            menu.remove();
        });
        $('.workarea').append(menu);
        e.preventDefault();
        fixMenuPosition(menu);
    });

    $('.workarea').mousemove((e) => {
        let x = (e.pageX - $('svg.canvas').offset().left) + $(window).scrollLeft();
        let y = (e.pageY - $('svg.canvas').offset().top) + $(window).scrollTop();
        let lx = Math.round(x / $('svg.canvas').width() * global.canvasWidth / global.mouseStep) * global.mouseStep;
        let ly = Math.round(y / $('svg.canvas').height() * global.canvasHeight / global.mouseStep) * global.mouseStep;
        $('.loc-panel').text(lx + ', ' + ly);
        if (nodeActive) {
            let offsetX = (x - originalMousePosition.x) / $('svg.canvas').width() * global.canvasWidth + originalPosition.x;
            let offsetY = (y - originalMousePosition.y) / $('svg.canvas').height() * global.canvasHeight + originalPosition.y;
            if (offsetX < 0) {
                offsetX = 0;
            } else if (offsetX > global.canvasWidth) {
                offsetX = global.canvasWidth;
            }
            if (offsetY < 0) {
                offsetY = 0;
            } else if (offsetY > global.canvasHeight) {
                offsetY = global.canvasHeight;
            }
            offsetX = Math.round(offsetX / global.mouseStep) * global.mouseStep;
            offsetY = Math.round(offsetY / global.mouseStep) * global.mouseStep;
            nodeActive.attr('transform', 'translate(' + offsetX + ',' + offsetY + ')');
            nodeActive.attr('data-x', offsetX);
            nodeActive.attr('data-y', offsetY);
        } else if (pinActive) {
            let offsetX = (x - originalMousePosition.x) / $('svg.canvas').width() * global.canvasWidth + originalPosition.x;
            let offsetY = (y - originalMousePosition.y) / $('svg.canvas').height() * global.canvasHeight + originalPosition.y;
            offsetX = Math.round(offsetX / global.mouseStep) * global.mouseStep;
            offsetY = Math.round(offsetY / global.mouseStep) * global.mouseStep;
            pinActive.attr('cx', offsetX);
            pinActive.attr('cy', offsetY);
            refreshNode(pinParent);
        } else if (selectActive) {
            selectBox.w = x;
            selectBox.z = y;
            let l, r, t, b;
            if (selectBox.x > x) {
                l = selectBox.w;
                r = $('svg.canvas').width() - selectBox.x;
            } else {
                l = selectBox.x;
                r = $('svg.canvas').width() - selectBox.w;
            }
            if (selectBox.y > y) {
                t = selectBox.z;
                b = $('svg.canvas').height() - selectBox.y;
            } else {
                t = selectBox.y;
                b = $('svg.canvas').height() - selectBox.z;
            }
            $('.select-box').css('left', l + 'px');
            $('.select-box').css('right', r + 'px');
            $('.select-box').css('top', t + 'px');
            $('.select-box').css('bottom', b + 'px');
        } else if (moveActive === 2) {
            let offsetX = (x - originalMousePosition.x);
            let offsetY = (y - originalMousePosition.y);
            let l, r, t, b;
            moveBox.x = moveOriginalBox.x + offsetX;
            moveBox.w = moveOriginalBox.w + offsetX;
            moveBox.y = moveOriginalBox.y + offsetY;
            moveBox.z = moveOriginalBox.z + offsetY;
            l = moveBox.x;
            r = $('svg.canvas').width() - moveBox.w;
            t = moveBox.y;
            b = $('svg.canvas').height() - moveBox.z;
            $('.move-box').css('left', l + 'px');
            $('.move-box').css('right', r + 'px');
            $('.move-box').css('top', t + 'px');
            $('.move-box').css('bottom', b + 'px');
            moveList.forEach((node, idx) => {
                originalPosition = movePositionList[idx];
                offsetX = (x - originalMousePosition.x) / $('svg.canvas').width() * global.canvasWidth + originalPosition.x;
                offsetY = (y - originalMousePosition.y) / $('svg.canvas').height() * global.canvasHeight + originalPosition.y;
                offsetX = Math.round(offsetX / global.mouseStep) * global.mouseStep;
                offsetY = Math.round(offsetY / global.mouseStep) * global.mouseStep;
                let str = 'translate(' + offsetX + ',' + offsetY + ')';
                if (node.attr('transform') === str) {
                    return;
                }
                node.attr('transform', str);
                node.attr('data-x', offsetX);
                node.attr('data-y', offsetY);
            });
        }
    });

    $('.workarea').mousedown((e) => {
        if ($(e.target).is('svg') || $(e.target).is('.workarea') || $(e.target).is('.move-box')) {
            if (nodeActive) {
                nodeActive = undefined;
            }
            if (pinActive) {
                pinActive = undefined;
            }
            if (!selectActive) {
                if ($(e.target).is('svg') || $(e.target).is('.workarea')) {
                    let x = (e.pageX - $('svg.canvas').offset().left) + $(window).scrollLeft();
                    let y = (e.pageY - $('svg.canvas').offset().top) + $(window).scrollTop();
                    selectBox.x = x;
                    selectBox.y = y;
                    selectBox.w = x;
                    selectBox.z = y;
                    $('.workarea').append($('<div></div>').addClass('select-box'));
                    selectActive = true;
                }
            }
            if (moveActive) {
                if ($(e.target).is('.move-box')) {
                    let x = (e.pageX - $('svg.canvas').offset().left) + $(window).scrollLeft();
                    let y = (e.pageY - $('svg.canvas').offset().top) + $(window).scrollTop();
                    originalMousePosition = {
                        x,
                        y
                    };
                    movePositionList = [];
                    moveList.forEach((obj) => {
                        let x = parseInt(obj.attr('data-x'));
                        let y = parseInt(obj.attr('data-y'));
                        movePositionList.push({
                            x,
                            y
                        });
                    });
                    $('.move-box').addClass('moving');
                    moveActive = 2;
                } else {
                    $('.move-box').remove();
                    moveBox = {};
                    moveActive = 0;
                }
            }
        }
    });

    $('.workarea').mouseup((e) => {
        if (nodeActive) {
            nodeActive = undefined;
        }
        if (pinActive) {
            pinActive = undefined;
        }
        if (selectActive) {
            selectActive = false;
            $('.select-box').remove();
            let l, r, t, b;
            if (selectBox.x > selectBox.w) {
                l = selectBox.w;
                r = $('svg.canvas').width() - selectBox.x;
                moveBox.x = selectBox.w;
                moveBox.w = selectBox.x;
            } else {
                l = selectBox.x;
                r = $('svg.canvas').width() - selectBox.w;
                moveBox.x = selectBox.x;
                moveBox.w = selectBox.w;
            }
            if (selectBox.y > selectBox.z) {
                t = selectBox.z;
                b = $('svg.canvas').height() - selectBox.y;
                moveBox.y = selectBox.z;
                moveBox.z = selectBox.y;
            } else {
                t = selectBox.y;
                b = $('svg.canvas').height() - selectBox.z;
                moveBox.y = selectBox.y;
                moveBox.z = selectBox.z;
            }
            moveList = [];
            $('svg.canvas g.draw').each((idx, n) => {
                let obj = $(n);
                let points = [];
                let x = parseInt(obj.attr('data-x'));
                let y = parseInt(obj.attr('data-y'));
                points.push([x, y]);
                if (obj.find('circle[data-id="1"]').length > 0) {
                    points.push([parseInt(obj.find('circle[data-id="1"]').attr('cx')) + x, parseInt(obj.find('circle[data-id="1"]').attr('cy')) + y]);
                }
                if (obj.find('circle[data-id="2"]').length > 0) {
                    points.push([parseInt(obj.find('circle[data-id="2"]').attr('cx')) + x, parseInt(obj.find('circle[data-id="2"]').attr('cy')) + y]);
                }
                if (obj.find('circle[data-id="3"]').length > 0) {
                    points.push([parseInt(obj.find('circle[data-id="3"]').attr('cx')) + x, parseInt(obj.find('circle[data-id="3"]').attr('cy')) + y]);
                }
                if (checkInside(points, moveBox)) {
                    moveList.push(obj);
                }
            });
            if (moveList.length) {
                moveActive = 1;
                moveOriginalBox = Object.assign({}, moveBox);
                let node = $('<section class="move-box"></section>');
                $('.workarea').append(node);
                node.css('left', l + 'px');
                node.css('right', r + 'px');
                node.css('top', t + 'px');
                node.css('bottom', b + 'px');
                node.contextmenu((e) => {
                    $('.node-menu').remove();
                    let obj = $(e.currentTarget);
                    let menu = $('<div type="text" />').addClass('node-menu');
                    menu.append($('.menu-move-box').clone());
                    let x = (e.pageX - $('svg.canvas').offset().left) + $(window).scrollLeft() - 5;
                    let y = (e.pageY - $('svg.canvas').offset().top) + $(window).scrollTop() - 5;
                    menu.css('left', x + 'px');
                    menu.css('top', y + 'px');
                    menu.click((e) => {
                        if ($(e.target).data('action') === 0) {
                            moveList.forEach((node, idx) => {
                                node.remove();
                            });
                            $('.move-box').remove();
                            moveList = [];
                            moveBox = {};
                            moveActive = 0;
                        } else if ($(e.target).data('action') === 10) {
                            moveList.forEach((node, idx) => {
                                let offsetX = parseInt(node.attr('data-x')) + 20;
                                let offsetY = parseInt(node.attr('data-y')) + 20;
                                let str = 'translate(' + offsetX + ',' + offsetY + ')';
                                let newNode = node.clone();
                                newNode.attr('transform', str);
                                newNode.attr('data-x', offsetX);
                                newNode.attr('data-y', offsetY);
                                newNode.appendTo(node.parent());
                            });
                        }
                        menu.remove();
                    });
                    $('.workarea').append(menu);
                    e.preventDefault();
                    fixMenuPosition(menu);
                });
            }
            selectBox = {};
        }
        if (moveActive === 2) {
            moveActive = 1;
            $('.move-box').removeClass('moving');
            moveOriginalBox = Object.assign({}, moveBox);
        }
    });

    $('.controls').mouseup((e) => {
        if (nodeActive) {
            nodeActive.remove();
            nodeActive = undefined;
        }
        if (pinActive) {
            pinActive = undefined;
        }
    });

    (($) => {
        $.attrHooks['viewbox'] = {
            set: function (elem, value, name) {
                elem.setAttributeNS(null, 'viewBox', value + '');
                return value;
            }
        };
        $.fn.drags = function (opt) {
            opt = $.extend({
                handle: ""
            }, opt);

            if (opt.handle === "") {
                var $el = this;
                var $obj = $(this);
            } else {
                var $el = this.find(opt.handle);
                var $obj = $(this);
            }

            return $el.on("mousedown", (e) => {
                $obj.addClass('draggable');
                var drg_h = $obj.outerHeight(),
                    drg_w = $obj.outerWidth(),
                    pos_y = $obj.offset().top + drg_h - e.pageY,
                    pos_x = $obj.offset().left + drg_w - e.pageX;
                $obj.parents().on("mousemove", (e) => {
                    $obj.offset({
                        top: e.pageY + pos_y - drg_h,
                        left: e.pageX + pos_x - drg_w
                    }).on("mouseup", () => {
                        $obj.parents().off("mousemove");
                    });
                });
                e.preventDefault(); // disable selection
            }).on("mouseup", () => {
                $obj.parents().off("mousemove");
            });
        }
    })(jQuery);

    $('.setting-panel').drags({
        handle: ".setting-title"
    });

    $('.setting-close').click((e) => {
        $('.setting-panel').hide();
    });

    $('.setting-button.cancel').click((e) => {
        $('.setting-panel').hide();
    });

    $('.setting-button.submit').click((e) => {
        if (cfgSet.type === 'global') {
            cfgSet.frames.forEach((n) => {
                for (let key in n) {
                    if (!cfgHlpSet[key]) {
                        break;
                    }
                    n[key] = $('.setting-form').find('#' + key).val();
                    if (cfgHlpSet[key].type === "int") {
                        n[key] = parseInt(n[key]);
                    } else if (cfgHlpSet[key].type === "number") {
                        n[key] = parseFloat(n[key]);
                    }
                    global[key] = n[key];
                }
            });
            canvasTitle = global.canvasTitle;
            $('.control-title').text(global.canvasTitle);
            $('.canvas-title').text(global.canvasTitle);

            $('svg.canvas').attr('width', global.canvasWidth);
            $('svg.canvas').attr('height', global.canvasHeight);
            $('svg.canvas').attr('viewBox', '0 0 ' + global.canvasWidth + ' ' + global.canvasHeight);
            $('.workarea').css('width', 0.04 * global.canvasWidth + 'em');
            $('.workarea').css('height', 0.04 * global.canvasHeight + 'em');
            $('.workarea').css('background-size', 0.04 * global.gridSize + 'em ' + 0.04 * global.gridSize + 'em');
            $('.workarea').css('background-color', '#' + global.canvasBackground);
            $('.line, .polyline, .rectangle, .ellipse, .diamond, .button').css('stroke', '#' + global.canvasStrokeColor);
            $('.dot>circle').css('fill', '#' + global.canvasStrokeColor);
            $('.arrow').css('fill', '#' + global.canvasStrokeColor);
            $('.line, .polyline').css('stroke-width', global.lineStroke);
            $('.rectangle, .ellipse, .diamond, .button').css('stroke-width', global.polygonStroke);
        }
        $('.setting-panel').hide();
    });

    $('body').on('task:start', (e, hlp) => {
        pushHelper = hlp;
        startPushing();
    });

    $('body').removeClass('init');

});

//$(window).bind('beforeunload', () => "确定要离开这个页面吗？");
