var modules = modules || {};
var modules_info = modules_info || {};

var timeout_load_module;

function require(module_name, after_initialize) {
    if (typeof module_name !== 'string')
        throw 'Require s� suporta um m�dulo';

    var mod = modules[module_name];
    var modinfo = modules_info[module_name];

    if (typeof mod === "undefined") {
        curr_module_name = module_name;
        var modulo_exports = {};
        modules[module_name] = modulo_exports;
        modinfo = { name: module_name, exports: modulo_exports, dependencias: null, func: null, inicializado: false, callbacks: [] };
        modules_info[module_name] = modinfo;
        var arq_modulo = module_name + ".js";
        IncludeJSSRC("js_mod_" + module_name, arq_modulo);
    }

    if (typeof after_initialize !== "undefined") {
        if (modinfo.inicializado)
            after_initialize()
        else
            modinfo.callbacks.push(after_initialize);
    }
}

function define(module_name, dependencias, modulo_func) {
    
    if ((typeof module_name !== 'string') || (typeof dependencias !== 'object') || (typeof modulo_func !== 'function'))
        throw 'Compilador Typescript n�o tem a adapta��o para AMD';

    modules_info[module_name].dependencias = dependencias;
    modules_info[module_name].func = modulo_func;
    var argumentos = [];

    agenda_inicializacao_modulos();
    for (var i = 0; i < dependencias.length; i++) {
        if (dependencias[i] != 'require' && dependencias[i] != "exports")
            require(dependencias[i]);
    }

}

function agenda_inicializacao_modulos() {
    if (timeout_load_module)
        clearTimeout(timeout_load_module);
    timeout_load_module = setTimeout(inicializacao_modulos, 500);
}

function inicializacao_modulos() {
    for (var module in modules_info) {
        var info = modules_info[module];
        if (!inicia_modulo(info)) {
            agenda_inicializacao_modulos();
            break;
        }
    }
}

function inicia_modulo(info) {

    var argumentos = [];

    if (info.dependencias == null)
        return false;

    for (var i = 0; i < info.dependencias.length; i++) {
        var depname = info.dependencias[i];
        if (depname == 'require')
            argumentos.push(require);
        else if (depname == "exports")
            argumentos.push(info.exports);
        else {
            var depinfo = modules_info[depname];
            if (!inicia_modulo(depinfo))
                return false;
            argumentos.push(depinfo.exports);
        }
    }
    if (!info.inicializado) {
        info.func.apply(info.func, argumentos);
        for (var i = 0; i < info.callbacks.length; i++)
            (function(idx){
                setTimeout(function () {
                    info.callbacks[idx](info.exports);
                },1);
            })(i);
        info.inicializado = true;
    }
    return true;
}

function IncludeJSSRC(sId, fileUrl) {
    var oScript = document.createElement("script");
    oScript.language = "javascript";
    oScript.type = "text/javascript";
    oScript.defer = true;
    oScript.id = sId;
    oScript.src = fileUrl;

    document.body.appendChild(oScript);
}

window.onload=function()
{
    var data_main_ok = false;
    var scripts=document.body.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (script.getAttribute('src').indexOf('qualiom_require.js')>=0) {
            var data_main = script.getAttribute('data-main');
            require(data_main);
            data_main_ok = true;
        }
    }
    if (!data_main_ok)
        throw "Faltou data-main na inclusao do m�dulo"
   var oHead = document.getElementsByTagName('HEAD').item(0);
}

window.require = require;
window.define = define;