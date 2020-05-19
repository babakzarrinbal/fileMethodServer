const exp = {};
const fs = require("fs");
const path = require("path");

/**
 * listing methods base on filepath/method
 * @param {string} filePath main folder path
 * @param {object} options options for listing methods
 * @param {RegExp} options.ignore regexpression to ignore file and folders defult=> ^(_|\.)
 * @param {RegExp} options.accept regexpression to accept file and folders defult=>null (all)
 * @param {string} options.rootpath root path for creating url of method => default =>""
 * @param {boolean} options.recursive to list subfolders also default=>true
 */
exp.getFileMethods = function getFileMethods(filePath) {
  try {
    let methods = require(path.resolve(filePath));
    if(typeof methods == "object") return null;
    return Object.keys(methods).reduce((cu,name) => {
      ([
        ...cu,
        {
        path: path.join(filepath, name).replace(/\\/g, "/"),
        name,
        method: methods[name]
      }])
    });
  } catch (e) {
    console.log(e);
    return null;
  }
};

/**
 * listing files with given address
 * @param {string} folderpath main folder path
 * @param {object} options options for listing methods
 * @param {boolean} options.format array or comma seperated string of acceptable file formats
 * @param {RegExp} options.ignore regexpression to ignore file and folders defult=> ^(_|\.)
 * @param {RegExp} options.accept regexpression to accept file and folders defult=>null (all)
 * @param {boolean} options.recursive to list subfolders also default=>true
 */
exp.listFiles = function listFiles(folderpath, options = {}) {
  folderpath = folderpath.replace(/\\/g,"/");
  options.__rootpath = options.__rootpath || "";
  options.startPath = options.startPath ||folderpath;
  options.ignore = options.ignore || /^(_|\.)/;
  options.recursive = options.recursive != undefined ? options.recursive : true;
  if (options.format)
    options.format = Array.isArray(options.format)
      ? options.format
      : options.format.split(",");

  let resultFiles = [];
  let files = fs.readdirSync(path.resolve(folderpath));
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (
      file.match(options.ignore) ||
      (options.accept && !file.match(options.ignore))
    )
      continue;
    let address = path.resolve(folderpath, file);
    if (!fs.statSync(address).isDirectory()) {
      let name = file.split(".");
      format = name.length > 1 ? name.pop() : "";
      if (options.format && !options.format.includes(format)) continue;
      let relative = path.join(options.__rootpath, file).replace(/\\/g,"/");
      let absolute = path.resolve(relative).replace(/\\/g,"/");
      let directory = absolute.includes('/')
        ? absolute.slice(0, absolute.lastIndexOf("/") + 1)
        : "";
      resultFiles.push({
        name: name.join("."),
        format,
        directory,
        relative:relative.replace(/\\/g,"/"),
        absolute,
        startPath: options.startPath
      });
    } else if (options.recursive) {
      resultFiles.push(
        ...listFiles(address, {
          __rootpath: path.join(options.__rootpath, file),
          ignore: options.ignore,
          startPath: options.startPath,
          accept: options.accept || null
        })
      );
    }
  }
  return resultFiles;
};

module.exports = exp;
