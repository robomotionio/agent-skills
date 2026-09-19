import {
  Xa,
  clsx
} from "./chunk-AAFKE4O6.js";

// node_modules/tailwind-merge/dist/bundle-mjs.mjs
var CLASS_PART_SEPARATOR = "-";
var createClassGroupUtils = (config) => {
  const classMap = createClassMap(config);
  const {
    conflictingClassGroups,
    conflictingClassGroupModifiers
  } = config;
  const getClassGroupId = (className) => {
    const classParts = className.split(CLASS_PART_SEPARATOR);
    if (classParts[0] === "" && classParts.length !== 1) {
      classParts.shift();
    }
    return getGroupRecursive(classParts, classMap) || getGroupIdForArbitraryProperty(className);
  };
  const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
    const conflicts = conflictingClassGroups[classGroupId] || [];
    if (hasPostfixModifier && conflictingClassGroupModifiers[classGroupId]) {
      return [...conflicts, ...conflictingClassGroupModifiers[classGroupId]];
    }
    return conflicts;
  };
  return {
    getClassGroupId,
    getConflictingClassGroupIds
  };
};
var getGroupRecursive = (classParts, classPartObject) => {
  if (classParts.length === 0) {
    return classPartObject.classGroupId;
  }
  const currentClassPart = classParts[0];
  const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
  const classGroupFromNextClassPart = nextClassPartObject ? getGroupRecursive(classParts.slice(1), nextClassPartObject) : void 0;
  if (classGroupFromNextClassPart) {
    return classGroupFromNextClassPart;
  }
  if (classPartObject.validators.length === 0) {
    return void 0;
  }
  const classRest = classParts.join(CLASS_PART_SEPARATOR);
  return classPartObject.validators.find(({
    validator
  }) => validator(classRest))?.classGroupId;
};
var arbitraryPropertyRegex = /^\[(.+)\]$/;
var getGroupIdForArbitraryProperty = (className) => {
  if (arbitraryPropertyRegex.test(className)) {
    const arbitraryPropertyClassName = arbitraryPropertyRegex.exec(className)[1];
    const property = arbitraryPropertyClassName?.substring(0, arbitraryPropertyClassName.indexOf(":"));
    if (property) {
      return "arbitrary.." + property;
    }
  }
};
var createClassMap = (config) => {
  const {
    theme,
    prefix
  } = config;
  const classMap = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  const prefixedClassGroupEntries = getPrefixedClassGroupEntries(Object.entries(config.classGroups), prefix);
  prefixedClassGroupEntries.forEach(([classGroupId, classGroup]) => {
    processClassesRecursively(classGroup, classMap, classGroupId, theme);
  });
  return classMap;
};
var processClassesRecursively = (classGroup, classPartObject, classGroupId, theme) => {
  classGroup.forEach((classDefinition) => {
    if (typeof classDefinition === "string") {
      const classPartObjectToEdit = classDefinition === "" ? classPartObject : getPart(classPartObject, classDefinition);
      classPartObjectToEdit.classGroupId = classGroupId;
      return;
    }
    if (typeof classDefinition === "function") {
      if (isThemeGetter(classDefinition)) {
        processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
        return;
      }
      classPartObject.validators.push({
        validator: classDefinition,
        classGroupId
      });
      return;
    }
    Object.entries(classDefinition).forEach(([key, classGroup2]) => {
      processClassesRecursively(classGroup2, getPart(classPartObject, key), classGroupId, theme);
    });
  });
};
var getPart = (classPartObject, path) => {
  let currentClassPartObject = classPartObject;
  path.split(CLASS_PART_SEPARATOR).forEach((pathPart) => {
    if (!currentClassPartObject.nextPart.has(pathPart)) {
      currentClassPartObject.nextPart.set(pathPart, {
        nextPart: /* @__PURE__ */ new Map(),
        validators: []
      });
    }
    currentClassPartObject = currentClassPartObject.nextPart.get(pathPart);
  });
  return currentClassPartObject;
};
var isThemeGetter = (func) => func.isThemeGetter;
var getPrefixedClassGroupEntries = (classGroupEntries, prefix) => {
  if (!prefix) {
    return classGroupEntries;
  }
  return classGroupEntries.map(([classGroupId, classGroup]) => {
    const prefixedClassGroup = classGroup.map((classDefinition) => {
      if (typeof classDefinition === "string") {
        return prefix + classDefinition;
      }
      if (typeof classDefinition === "object") {
        return Object.fromEntries(Object.entries(classDefinition).map(([key, value]) => [prefix + key, value]));
      }
      return classDefinition;
    });
    return [classGroupId, prefixedClassGroup];
  });
};
var createLruCache = (maxCacheSize) => {
  if (maxCacheSize < 1) {
    return {
      get: () => void 0,
      set: () => {
      }
    };
  }
  let cacheSize = 0;
  let cache = /* @__PURE__ */ new Map();
  let previousCache = /* @__PURE__ */ new Map();
  const update = (key, value) => {
    cache.set(key, value);
    cacheSize++;
    if (cacheSize > maxCacheSize) {
      cacheSize = 0;
      previousCache = cache;
      cache = /* @__PURE__ */ new Map();
    }
  };
  return {
    get(key) {
      let value = cache.get(key);
      if (value !== void 0) {
        return value;
      }
      if ((value = previousCache.get(key)) !== void 0) {
        update(key, value);
        return value;
      }
    },
    set(key, value) {
      if (cache.has(key)) {
        cache.set(key, value);
      } else {
        update(key, value);
      }
    }
  };
};
var IMPORTANT_MODIFIER = "!";
var createParseClassName = (config) => {
  const {
    separator,
    experimentalParseClassName
  } = config;
  const isSeparatorSingleCharacter = separator.length === 1;
  const firstSeparatorCharacter = separator[0];
  const separatorLength = separator.length;
  const parseClassName = (className) => {
    const modifiers = [];
    let bracketDepth = 0;
    let modifierStart = 0;
    let postfixModifierPosition;
    for (let index = 0; index < className.length; index++) {
      let currentCharacter = className[index];
      if (bracketDepth === 0) {
        if (currentCharacter === firstSeparatorCharacter && (isSeparatorSingleCharacter || className.slice(index, index + separatorLength) === separator)) {
          modifiers.push(className.slice(modifierStart, index));
          modifierStart = index + separatorLength;
          continue;
        }
        if (currentCharacter === "/") {
          postfixModifierPosition = index;
          continue;
        }
      }
      if (currentCharacter === "[") {
        bracketDepth++;
      } else if (currentCharacter === "]") {
        bracketDepth--;
      }
    }
    const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.substring(modifierStart);
    const hasImportantModifier = baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER);
    const baseClassName = hasImportantModifier ? baseClassNameWithImportantModifier.substring(1) : baseClassNameWithImportantModifier;
    const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : void 0;
    return {
      modifiers,
      hasImportantModifier,
      baseClassName,
      maybePostfixModifierPosition
    };
  };
  if (experimentalParseClassName) {
    return (className) => experimentalParseClassName({
      className,
      parseClassName
    });
  }
  return parseClassName;
};
var sortModifiers = (modifiers) => {
  if (modifiers.length <= 1) {
    return modifiers;
  }
  const sortedModifiers = [];
  let unsortedModifiers = [];
  modifiers.forEach((modifier) => {
    const isArbitraryVariant = modifier[0] === "[";
    if (isArbitraryVariant) {
      sortedModifiers.push(...unsortedModifiers.sort(), modifier);
      unsortedModifiers = [];
    } else {
      unsortedModifiers.push(modifier);
    }
  });
  sortedModifiers.push(...unsortedModifiers.sort());
  return sortedModifiers;
};
var createConfigUtils = (config) => ({
  cache: createLruCache(config.cacheSize),
  parseClassName: createParseClassName(config),
  ...createClassGroupUtils(config)
});
var SPLIT_CLASSES_REGEX = /\s+/;
var mergeClassList = (classList, configUtils) => {
  const {
    parseClassName,
    getClassGroupId,
    getConflictingClassGroupIds
  } = configUtils;
  const classGroupsInConflict = [];
  const classNames = classList.trim().split(SPLIT_CLASSES_REGEX);
  let result = "";
  for (let index = classNames.length - 1; index >= 0; index -= 1) {
    const originalClassName = classNames[index];
    const {
      modifiers,
      hasImportantModifier,
      baseClassName,
      maybePostfixModifierPosition
    } = parseClassName(originalClassName);
    let hasPostfixModifier = Boolean(maybePostfixModifierPosition);
    let classGroupId = getClassGroupId(hasPostfixModifier ? baseClassName.substring(0, maybePostfixModifierPosition) : baseClassName);
    if (!classGroupId) {
      if (!hasPostfixModifier) {
        result = originalClassName + (result.length > 0 ? " " + result : result);
        continue;
      }
      classGroupId = getClassGroupId(baseClassName);
      if (!classGroupId) {
        result = originalClassName + (result.length > 0 ? " " + result : result);
        continue;
      }
      hasPostfixModifier = false;
    }
    const variantModifier = sortModifiers(modifiers).join(":");
    const modifierId = hasImportantModifier ? variantModifier + IMPORTANT_MODIFIER : variantModifier;
    const classId = modifierId + classGroupId;
    if (classGroupsInConflict.includes(classId)) {
      continue;
    }
    classGroupsInConflict.push(classId);
    const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
    for (let i = 0; i < conflictGroups.length; ++i) {
      const group = conflictGroups[i];
      classGroupsInConflict.push(modifierId + group);
    }
    result = originalClassName + (result.length > 0 ? " " + result : result);
  }
  return result;
};
function twJoin() {
  let index = 0;
  let argument;
  let resolvedValue;
  let string = "";
  while (index < arguments.length) {
    if (argument = arguments[index++]) {
      if (resolvedValue = toValue(argument)) {
        string && (string += " ");
        string += resolvedValue;
      }
    }
  }
  return string;
}
var toValue = (mix) => {
  if (typeof mix === "string") {
    return mix;
  }
  let resolvedValue;
  let string = "";
  for (let k = 0; k < mix.length; k++) {
    if (mix[k]) {
      if (resolvedValue = toValue(mix[k])) {
        string && (string += " ");
        string += resolvedValue;
      }
    }
  }
  return string;
};
function createTailwindMerge(createConfigFirst, ...createConfigRest) {
  let configUtils;
  let cacheGet;
  let cacheSet;
  let functionToCall = initTailwindMerge;
  function initTailwindMerge(classList) {
    const config = createConfigRest.reduce((previousConfig, createConfigCurrent) => createConfigCurrent(previousConfig), createConfigFirst());
    configUtils = createConfigUtils(config);
    cacheGet = configUtils.cache.get;
    cacheSet = configUtils.cache.set;
    functionToCall = tailwindMerge;
    return tailwindMerge(classList);
  }
  function tailwindMerge(classList) {
    const cachedResult = cacheGet(classList);
    if (cachedResult) {
      return cachedResult;
    }
    const result = mergeClassList(classList, configUtils);
    cacheSet(classList, result);
    return result;
  }
  return function callTailwindMerge() {
    return functionToCall(twJoin.apply(null, arguments));
  };
}
var fromTheme = (key) => {
  const themeGetter = (theme) => theme[key] || [];
  themeGetter.isThemeGetter = true;
  return themeGetter;
};
var arbitraryValueRegex = /^\[(?:([a-z-]+):)?(.+)\]$/i;
var fractionRegex = /^\d+\/\d+$/;
var stringLengths = /* @__PURE__ */ new Set(["px", "full", "screen"]);
var tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
var lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
var colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
var shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
var imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
var isLength = (value) => isNumber(value) || stringLengths.has(value) || fractionRegex.test(value);
var isArbitraryLength = (value) => getIsArbitraryValue(value, "length", isLengthOnly);
var isNumber = (value) => Boolean(value) && !Number.isNaN(Number(value));
var isArbitraryNumber = (value) => getIsArbitraryValue(value, "number", isNumber);
var isInteger = (value) => Boolean(value) && Number.isInteger(Number(value));
var isPercent = (value) => value.endsWith("%") && isNumber(value.slice(0, -1));
var isArbitraryValue = (value) => arbitraryValueRegex.test(value);
var isTshirtSize = (value) => tshirtUnitRegex.test(value);
var sizeLabels = /* @__PURE__ */ new Set(["length", "size", "percentage"]);
var isArbitrarySize = (value) => getIsArbitraryValue(value, sizeLabels, isNever);
var isArbitraryPosition = (value) => getIsArbitraryValue(value, "position", isNever);
var imageLabels = /* @__PURE__ */ new Set(["image", "url"]);
var isArbitraryImage = (value) => getIsArbitraryValue(value, imageLabels, isImage);
var isArbitraryShadow = (value) => getIsArbitraryValue(value, "", isShadow);
var isAny = () => true;
var getIsArbitraryValue = (value, label, testValue) => {
  const result = arbitraryValueRegex.exec(value);
  if (result) {
    if (result[1]) {
      return typeof label === "string" ? result[1] === label : label.has(result[1]);
    }
    return testValue(result[2]);
  }
  return false;
};
var isLengthOnly = (value) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  lengthUnitRegex.test(value) && !colorFunctionRegex.test(value)
);
var isNever = () => false;
var isShadow = (value) => shadowRegex.test(value);
var isImage = (value) => imageRegex.test(value);
var getDefaultConfig = () => {
  const colors = fromTheme("colors");
  const spacing = fromTheme("spacing");
  const blur = fromTheme("blur");
  const brightness = fromTheme("brightness");
  const borderColor = fromTheme("borderColor");
  const borderRadius = fromTheme("borderRadius");
  const borderSpacing = fromTheme("borderSpacing");
  const borderWidth = fromTheme("borderWidth");
  const contrast = fromTheme("contrast");
  const grayscale = fromTheme("grayscale");
  const hueRotate = fromTheme("hueRotate");
  const invert = fromTheme("invert");
  const gap = fromTheme("gap");
  const gradientColorStops = fromTheme("gradientColorStops");
  const gradientColorStopPositions = fromTheme("gradientColorStopPositions");
  const inset = fromTheme("inset");
  const margin = fromTheme("margin");
  const opacity = fromTheme("opacity");
  const padding = fromTheme("padding");
  const saturate = fromTheme("saturate");
  const scale = fromTheme("scale");
  const sepia = fromTheme("sepia");
  const skew = fromTheme("skew");
  const space = fromTheme("space");
  const translate = fromTheme("translate");
  const getOverscroll = () => ["auto", "contain", "none"];
  const getOverflow = () => ["auto", "hidden", "clip", "visible", "scroll"];
  const getSpacingWithAutoAndArbitrary = () => ["auto", isArbitraryValue, spacing];
  const getSpacingWithArbitrary = () => [isArbitraryValue, spacing];
  const getLengthWithEmptyAndArbitrary = () => ["", isLength, isArbitraryLength];
  const getNumberWithAutoAndArbitrary = () => ["auto", isNumber, isArbitraryValue];
  const getPositions = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"];
  const getLineStyles = () => ["solid", "dashed", "dotted", "double", "none"];
  const getBlendModes = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
  const getAlign = () => ["start", "end", "center", "between", "around", "evenly", "stretch"];
  const getZeroAndEmpty = () => ["", "0", isArbitraryValue];
  const getBreaks = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"];
  const getNumberAndArbitrary = () => [isNumber, isArbitraryValue];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [isAny],
      spacing: [isLength, isArbitraryLength],
      blur: ["none", "", isTshirtSize, isArbitraryValue],
      brightness: getNumberAndArbitrary(),
      borderColor: [colors],
      borderRadius: ["none", "", "full", isTshirtSize, isArbitraryValue],
      borderSpacing: getSpacingWithArbitrary(),
      borderWidth: getLengthWithEmptyAndArbitrary(),
      contrast: getNumberAndArbitrary(),
      grayscale: getZeroAndEmpty(),
      hueRotate: getNumberAndArbitrary(),
      invert: getZeroAndEmpty(),
      gap: getSpacingWithArbitrary(),
      gradientColorStops: [colors],
      gradientColorStopPositions: [isPercent, isArbitraryLength],
      inset: getSpacingWithAutoAndArbitrary(),
      margin: getSpacingWithAutoAndArbitrary(),
      opacity: getNumberAndArbitrary(),
      padding: getSpacingWithArbitrary(),
      saturate: getNumberAndArbitrary(),
      scale: getNumberAndArbitrary(),
      sepia: getZeroAndEmpty(),
      skew: getNumberAndArbitrary(),
      space: getSpacingWithArbitrary(),
      translate: getSpacingWithArbitrary()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", isArbitraryValue]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [isTshirtSize]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": getBreaks()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": getBreaks()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...getPositions(), isArbitraryValue]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: getOverflow()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": getOverflow()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": getOverflow()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: getOverscroll()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": getOverscroll()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": getOverscroll()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [inset]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [inset]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [inset]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [inset]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [inset]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [inset]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [inset]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [inset]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [inset]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", isInteger, isArbitraryValue]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: getSpacingWithAutoAndArbitrary()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", isArbitraryValue]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: getZeroAndEmpty()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: getZeroAndEmpty()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", isInteger, isArbitraryValue]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [isAny]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", isInteger, isArbitraryValue]
        }, isArbitraryValue]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": getNumberWithAutoAndArbitrary()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": getNumberWithAutoAndArbitrary()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [isAny]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [isInteger, isArbitraryValue]
        }, isArbitraryValue]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": getNumberWithAutoAndArbitrary()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": getNumberWithAutoAndArbitrary()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", isArbitraryValue]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", isArbitraryValue]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [gap]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [gap]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [gap]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...getAlign()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...getAlign(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...getAlign(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [padding]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [padding]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [padding]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [padding]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [padding]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [padding]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [padding]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [padding]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [padding]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [margin]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [margin]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [margin]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [margin]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [margin]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [margin]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [margin]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [margin]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [margin]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [space]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [space]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", isArbitraryValue, spacing]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [isArbitraryValue, spacing, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [isArbitraryValue, spacing, "none", "full", "min", "max", "fit", "prose", {
          screen: [isTshirtSize]
        }, isTshirtSize]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [isArbitraryValue, spacing, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [isArbitraryValue, spacing, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [isArbitraryValue, spacing, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [isArbitraryValue, spacing, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", isTshirtSize, isArbitraryLength]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", isArbitraryNumber]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [isAny]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", isArbitraryValue]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", isNumber, isArbitraryNumber]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", isLength, isArbitraryValue]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", isArbitraryValue]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", isArbitraryValue]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [colors]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [opacity]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [colors]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [opacity]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...getLineStyles(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", isLength, isArbitraryLength]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", isLength, isArbitraryValue]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [colors]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: getSpacingWithArbitrary()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", isArbitraryValue]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", isArbitraryValue]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [opacity]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...getPositions(), isArbitraryPosition]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", isArbitrarySize]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, isArbitraryImage]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [colors]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [gradientColorStopPositions]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [gradientColorStopPositions]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [gradientColorStopPositions]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [gradientColorStops]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [gradientColorStops]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [gradientColorStops]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [borderRadius]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [borderRadius]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [borderRadius]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [borderRadius]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [borderRadius]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [borderRadius]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [borderRadius]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [borderRadius]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [borderRadius]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [borderRadius]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [borderRadius]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [borderRadius]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [borderRadius]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [borderRadius]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [borderRadius]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [borderWidth]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [borderWidth]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [borderWidth]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [borderWidth]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [borderWidth]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [borderWidth]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [borderWidth]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [borderWidth]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [borderWidth]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [opacity]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...getLineStyles(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [borderWidth]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [borderWidth]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [opacity]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: getLineStyles()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [borderColor]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [borderColor]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [borderColor]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [borderColor]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [borderColor]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [borderColor]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [borderColor]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [borderColor]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [borderColor]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [borderColor]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...getLineStyles()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [isLength, isArbitraryValue]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [isLength, isArbitraryLength]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [colors]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: getLengthWithEmptyAndArbitrary()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [colors]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [opacity]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [isLength, isArbitraryLength]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [colors]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", isTshirtSize, isArbitraryShadow]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [isAny]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [opacity]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...getBlendModes(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": getBlendModes()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [blur]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [brightness]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [contrast]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", isTshirtSize, isArbitraryValue]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [grayscale]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [hueRotate]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [invert]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [saturate]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [sepia]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [blur]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [brightness]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [contrast]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [grayscale]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [hueRotate]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [invert]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [opacity]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [saturate]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [sepia]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [borderSpacing]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [borderSpacing]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [borderSpacing]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", isArbitraryValue]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: getNumberAndArbitrary()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", isArbitraryValue]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: getNumberAndArbitrary()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", isArbitraryValue]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [scale]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [scale]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [scale]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [isInteger, isArbitraryValue]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [translate]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [translate]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [skew]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [skew]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", isArbitraryValue]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", colors]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", isArbitraryValue]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [colors]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": getSpacingWithArbitrary()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", isArbitraryValue]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [colors, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [isLength, isArbitraryLength, isArbitraryNumber]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [colors, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
};
var twMerge = /* @__PURE__ */ createTailwindMerge(getDefaultConfig);

// src/cn.ts
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/color.ts
function parseHex(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let s = m[1];
  if (s.length === 3) s = s.split("").map((ch) => ch + ch).join("");
  const n = parseInt(s, 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function srgbToLinear(v) {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function rgbToOklch(r, g, b) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.sqrt(a * a + bb * bb);
  let h = Math.atan2(bb, a) * 180 / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c: c < 1e-4 ? 0 : c, h: c < 1e-4 ? 0 : h };
}
function hexToOklch(hex) {
  const rgb = parseHex(hex);
  return rgb ? rgbToOklch(rgb[0], rgb[1], rgb[2]) : null;
}
function oklchTriple({ l, c, h }) {
  return `${round(l, 3)} ${round(c, 3)} ${round(h, 1)}`;
}
function round(n, digits) {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}
function contrastForeground(l) {
  return l > 0.7 ? "0.2 0.02 260" : "1 0 0";
}
var RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
var RAMP_L = {
  50: 0.975,
  100: 0.945,
  200: 0.89,
  300: 0.815,
  400: 0.73,
  500: 0.655,
  600: 0.585,
  700: 0.51,
  800: 0.43,
  900: 0.36,
  950: 0.26
};
var RAMP_C = {
  50: 0.14,
  100: 0.3,
  200: 0.52,
  300: 0.74,
  400: 0.9,
  500: 1,
  600: 1,
  700: 0.92,
  800: 0.78,
  900: 0.62,
  950: 0.45
};
function accentRamp(accent) {
  const out = {};
  for (const step of RAMP_STEPS) {
    out[step] = oklchTriple({ l: RAMP_L[step], c: accent.c * RAMP_C[step], h: accent.h });
  }
  return out;
}

// src/styles/tokens.generated.ts
var TOKENS_CSS = ':root {\n--rm-kit: 0.5;\n--rm-background: 0.985 0.002 250;\n--rm-foreground: 0.2 0.02 260;\n--rm-card: 1 0 0;\n--rm-card-foreground: 0.2 0.02 260;\n--rm-popover: 1 0 0;\n--rm-popover-foreground: 0.2 0.02 260;\n--rm-muted: 0.962 0.004 250;\n--rm-muted-foreground: 0.5 0.02 260;\n--rm-border: 0.915 0.006 250;\n--rm-input: 0.86 0.01 250;\n--rm-accent: #FF4F00;\n--rm-primary: 0.67 0.222 37.4;\n--rm-primary-foreground: 1 0 0;\n--rm-ring: 0.67 0.222 37.4;\n--rm-accent-50: 0.975 0.031 37.4;\n--rm-accent-100: 0.945 0.067 37.4;\n--rm-accent-200: 0.89 0.115 37.4;\n--rm-accent-300: 0.815 0.164 37.4;\n--rm-accent-400: 0.73 0.2 37.4;\n--rm-accent-500: 0.655 0.222 37.4;\n--rm-accent-600: 0.585 0.222 37.4;\n--rm-accent-700: 0.51 0.204 37.4;\n--rm-accent-800: 0.43 0.173 37.4;\n--rm-accent-900: 0.36 0.138 37.4;\n--rm-accent-950: 0.26 0.1 37.4;\n--rm-secondary: 0.95 0.005 250;\n--rm-secondary-foreground: 0.3 0.02 260;\n--rm-success: 0.627 0.17 149.2;\n--rm-success-foreground: 1 0 0;\n--rm-warning: 0.666 0.157 58.3;\n--rm-warning-foreground: 1 0 0;\n--rm-destructive: 0.577 0.215 27.3;\n--rm-destructive-foreground: 1 0 0;\n--rm-info: 0.546 0.215 262.9;\n--rm-info-foreground: 1 0 0;\n--rm-sidebar: 0.975 0.003 250;\n--rm-sidebar-foreground: 0.38 0.02 260;\n--rm-sidebar-border: 0.915 0.006 250;\n--rm-sidebar-accent: 0.93 0.006 250;\n--rm-chart-1: 0.67 0.222 37.4;\n--rm-chart-2: 0.6 0.16 255;\n--rm-chart-3: 0.7 0.14 165;\n--rm-chart-4: 0.78 0.15 85;\n--rm-chart-5: 0.62 0.2 320;\n--rm-radius: 0.5rem;\n--rm-shadow-sm: 0 1px 2px 0 oklch(0.2 0.02 260 / 0.06);\n--rm-shadow-md: 0 4px 12px -2px oklch(0.2 0.02 260 / 0.1), 0 2px 4px -2px oklch(0.2 0.02 260 / 0.06);\n--rm-shadow-lg: 0 12px 32px -6px oklch(0.2 0.02 260 / 0.16), 0 4px 8px -4px oklch(0.2 0.02 260 / 0.08);\n--rm-font-sans: "Inter Variable", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;\n--rm-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;\n}\n.dark {\n--rm-background: 0.15 0.008 260;\n--rm-foreground: 0.95 0.005 250;\n--rm-card: 0.195 0.009 260;\n--rm-card-foreground: 0.95 0.005 250;\n--rm-popover: 0.215 0.01 260;\n--rm-popover-foreground: 0.95 0.005 250;\n--rm-muted: 0.255 0.01 260;\n--rm-muted-foreground: 0.7 0.015 255;\n--rm-border: 0.28 0.01 260;\n--rm-input: 0.34 0.012 260;\n--rm-secondary: 0.265 0.01 260;\n--rm-secondary-foreground: 0.92 0.005 250;\n--rm-success: 0.723 0.192 149.6;\n--rm-success-foreground: 0.15 0.008 260;\n--rm-warning: 0.769 0.165 70.1;\n--rm-warning-foreground: 0.15 0.008 260;\n--rm-destructive: 0.637 0.208 25.3;\n--rm-destructive-foreground: 1 0 0;\n--rm-info: 0.623 0.188 259.8;\n--rm-info-foreground: 1 0 0;\n--rm-sidebar: 0.17 0.009 260;\n--rm-sidebar-foreground: 0.76 0.015 255;\n--rm-sidebar-border: 0.26 0.01 260;\n--rm-sidebar-accent: 0.245 0.01 260;\n--rm-chart-2: 0.68 0.15 255;\n--rm-chart-3: 0.76 0.13 165;\n--rm-chart-4: 0.82 0.14 85;\n--rm-chart-5: 0.7 0.17 320;\n--rm-shadow-sm: 0 1px 2px 0 oklch(0 0 0 / 0.4);\n--rm-shadow-md: 0 4px 12px -2px oklch(0 0 0 / 0.5), 0 2px 4px -2px oklch(0 0 0 / 0.4);\n--rm-shadow-lg: 0 12px 32px -6px oklch(0 0 0 / 0.6), 0 4px 8px -4px oklch(0 0 0 / 0.4);\n}\nhtml {\nfont-family: var(--rm-font-sans);\n-webkit-font-smoothing: antialiased;\n-moz-osx-font-smoothing: grayscale;\ntext-rendering: optimizeLegibility;\n}\n@keyframes rm-fade-in { from { opacity: 0; } to { opacity: 1; } }\n@keyframes rm-fade-out { from { opacity: 1; } to { opacity: 0; } }\n@keyframes rm-zoom-in { from { opacity: 0; transform: scale(0.96) translateY(4px); } to { opacity: 1; transform: none; } }\n@keyframes rm-zoom-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: scale(0.96) translateY(4px); } }\n@keyframes rm-slide-in-right { from { transform: translateX(100%); } to { transform: none; } }\n@keyframes rm-slide-out-right { from { transform: none; } to { transform: translateX(100%); } }\n@keyframes rm-slide-in-left { from { transform: translateX(-100%); } to { transform: none; } }\n@keyframes rm-slide-out-left { from { transform: none; } to { transform: translateX(-100%); } }\n@keyframes rm-slide-in-bottom { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }\n@keyframes rm-slide-out-bottom { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(12px); } }\n@keyframes rm-slide-in-top { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }\n@keyframes rm-slide-out-top { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-6px); } }\n@keyframes rm-collapse-in { from { grid-template-rows: 0fr; } to { grid-template-rows: 1fr; } }\n@keyframes rm-spin { to { transform: rotate(360deg); } }\n[data-rm-anim="backdrop"][data-state="open"] { animation: rm-fade-in 160ms ease-out both; }\n[data-rm-anim="backdrop"][data-state="closed"] { animation: rm-fade-out 140ms ease-in both; }\n[data-rm-anim="dialog"][data-state="open"] { animation: rm-zoom-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both; }\n[data-rm-anim="dialog"][data-state="closed"] { animation: rm-zoom-out 140ms ease-in both; }\n[data-rm-anim="popover"][data-state="open"] { animation: rm-slide-in-top 140ms cubic-bezier(0.16, 1, 0.3, 1) both; }\n[data-rm-anim="popover"][data-state="closed"] { animation: rm-fade-out 100ms ease-in both; }\n[data-rm-anim="drawer-right"][data-state="open"] { animation: rm-slide-in-right 220ms cubic-bezier(0.16, 1, 0.3, 1) both; }\n[data-rm-anim="drawer-right"][data-state="closed"] { animation: rm-slide-out-right 180ms ease-in both; }\n[data-rm-anim="drawer-left"][data-state="open"] { animation: rm-slide-in-left 220ms cubic-bezier(0.16, 1, 0.3, 1) both; }\n[data-rm-anim="drawer-left"][data-state="closed"] { animation: rm-slide-out-left 180ms ease-in both; }\n[data-rm-anim="toast"][data-state="open"] { animation: rm-slide-in-bottom 200ms cubic-bezier(0.16, 1, 0.3, 1) both; }\n[data-rm-anim="toast"][data-state="closed"] { animation: rm-fade-out 160ms ease-in both; }\n[data-rm-anim="collapse"][data-state="open"] { animation: rm-collapse-in 180ms ease-out both; }\n[data-rm-anim="fade"][data-state="open"] { animation: rm-fade-in 160ms ease-out both; }\n[data-rm-anim="fade"][data-state="closed"] { animation: rm-fade-out 120ms ease-in both; }\n@media (prefers-reduced-motion: reduce) {\n[data-rm-anim] { animation: none !important; }\n}';

// src/theme.ts
var DEFAULT_ACCENT = "#FF4F00";
var tk = {
  bgBackground: "bg-[color:oklch(var(--rm-background))]",
  bgCard: "bg-[color:oklch(var(--rm-card))]",
  bgPopover: "bg-[color:oklch(var(--rm-popover))]",
  bgMuted: "bg-[color:oklch(var(--rm-muted))]",
  bgMutedHalf: "bg-[color:oklch(var(--rm-muted)/0.5)]",
  bgSecondary: "bg-[color:oklch(var(--rm-secondary))]",
  bgPrimary: "bg-[color:oklch(var(--rm-primary))]",
  bgPrimarySoft: "bg-[color:oklch(var(--rm-primary)/0.1)]",
  bgDestructive: "bg-[color:oklch(var(--rm-destructive))]",
  bgDestructiveSoft: "bg-[color:oklch(var(--rm-destructive)/0.1)]",
  bgSuccess: "bg-[color:oklch(var(--rm-success))]",
  bgSuccessSoft: "bg-[color:oklch(var(--rm-success)/0.12)]",
  bgWarning: "bg-[color:oklch(var(--rm-warning))]",
  bgWarningSoft: "bg-[color:oklch(var(--rm-warning)/0.14)]",
  bgInfo: "bg-[color:oklch(var(--rm-info))]",
  bgInfoSoft: "bg-[color:oklch(var(--rm-info)/0.1)]",
  bgSidebar: "bg-[color:oklch(var(--rm-sidebar))]",
  bgSidebarAccent: "bg-[color:oklch(var(--rm-sidebar-accent))]",
  bgForeground: "bg-[color:oklch(var(--rm-foreground))]",
  bgBackgroundSoft: "bg-[color:oklch(var(--rm-background)/0.15)]",
  borderForeground: "border-[color:oklch(var(--rm-foreground))]",
  bgBorder: "bg-[color:oklch(var(--rm-border))]",
  bgInput: "bg-[color:oklch(var(--rm-input))]",
  fg: "text-[color:oklch(var(--rm-foreground))]",
  fgMuted: "text-[color:oklch(var(--rm-muted-foreground))]",
  fgCard: "text-[color:oklch(var(--rm-card-foreground))]",
  fgPopover: "text-[color:oklch(var(--rm-popover-foreground))]",
  fgBackground: "text-[color:oklch(var(--rm-background))]",
  fgBackgroundMuted: "text-[color:oklch(var(--rm-background)/0.7)]",
  fgPrimary: "text-[color:oklch(var(--rm-primary))]",
  fgOnPrimary: "text-[color:oklch(var(--rm-primary-foreground))]",
  fgSecondary: "text-[color:oklch(var(--rm-secondary-foreground))]",
  fgDestructive: "text-[color:oklch(var(--rm-destructive))]",
  fgOnDestructive: "text-[color:oklch(var(--rm-destructive-foreground))]",
  fgSuccess: "text-[color:oklch(var(--rm-success))]",
  fgWarning: "text-[color:oklch(var(--rm-warning))]",
  fgInfo: "text-[color:oklch(var(--rm-info))]",
  fgSidebar: "text-[color:oklch(var(--rm-sidebar-foreground))]",
  fgFaint: "text-[color:oklch(var(--rm-muted-foreground)/0.6)]",
  border: "border-[color:oklch(var(--rm-border))]",
  borderInput: "border-[color:oklch(var(--rm-input))]",
  borderPrimary: "border-[color:oklch(var(--rm-primary))]",
  borderDestructive: "border-[color:oklch(var(--rm-destructive))]",
  borderSuccess: "border-[color:oklch(var(--rm-success))]",
  borderWarning: "border-[color:oklch(var(--rm-warning))]",
  borderInfo: "border-[color:oklch(var(--rm-info))]",
  borderSidebar: "border-[color:oklch(var(--rm-sidebar-border))]",
  borderSuccessSoft: "border-[color:oklch(var(--rm-success)/0.3)]",
  borderWarningSoft: "border-[color:oklch(var(--rm-warning)/0.35)]",
  borderDestructiveSoft: "border-[color:oklch(var(--rm-destructive)/0.3)]",
  borderInfoSoft: "border-[color:oklch(var(--rm-info)/0.3)]",
  divide: "divide-[color:oklch(var(--rm-border))]",
  ring: "ring-[color:oklch(var(--rm-ring))]",
  ringBorder: "ring-[color:oklch(var(--rm-border))]",
  ringCard: "ring-[color:oklch(var(--rm-card))]",
  hoverBgMuted: "hover:bg-[color:oklch(var(--rm-muted))]",
  hoverBgMutedHalf: "hover:bg-[color:oklch(var(--rm-muted)/0.5)]",
  hoverBgSidebarAccent: "hover:bg-[color:oklch(var(--rm-sidebar-accent))]",
  hoverFg: "hover:text-[color:oklch(var(--rm-foreground))]",
  hoverFgSidebar: "hover:text-[color:oklch(var(--rm-foreground))]",
  hoverBgDestructiveSoft: "hover:bg-[color:oklch(var(--rm-destructive)/0.1)]",
  focusBgMuted: "focus:bg-[color:oklch(var(--rm-muted))]",
  focusBgDestructiveSoft: "focus:bg-[color:oklch(var(--rm-destructive)/0.1)]",
  selectedBgPrimarySoft: "bg-[color:oklch(var(--rm-primary)/0.08)]",
  fillPrimary: "fill-[color:oklch(var(--rm-primary))]",
  strokePrimary: "stroke-[color:oklch(var(--rm-primary))]",
  strokeBorder: "stroke-[color:oklch(var(--rm-border))]",
  radius: "rounded-[var(--rm-radius)]",
  radiusMd: "rounded-[calc(var(--rm-radius)_-_0.125rem)]",
  radiusSm: "rounded-[calc(var(--rm-radius)_-_0.25rem)]",
  radiusLg: "rounded-[calc(var(--rm-radius)_+_0.25rem)]",
  shadowSm: "shadow-[shadow:var(--rm-shadow-sm)]",
  shadowMd: "shadow-[shadow:var(--rm-shadow-md)]",
  shadowLg: "shadow-[shadow:var(--rm-shadow-lg)]",
  fontMono: "font-[family-name:var(--rm-font-mono)]"
};
var focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:oklch(var(--rm-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:oklch(var(--rm-background))]";
var inputBase = "block w-full rounded-[calc(var(--rm-radius)_-_0.125rem)] border border-[color:oklch(var(--rm-input))] bg-[color:oklch(var(--rm-card))] px-3 py-2 text-sm text-[color:oklch(var(--rm-foreground))] shadow-[shadow:var(--rm-shadow-sm)] transition-colors placeholder:text-[color:oklch(var(--rm-muted-foreground))] focus:border-[color:oklch(var(--rm-ring))] focus:outline-none focus:ring-1 focus:ring-[color:oklch(var(--rm-ring))] disabled:cursor-not-allowed disabled:bg-[color:oklch(var(--rm-muted))] disabled:text-[color:oklch(var(--rm-muted-foreground))] aria-[invalid=true]:border-[color:oklch(var(--rm-destructive))] aria-[invalid=true]:focus:ring-[color:oklch(var(--rm-destructive))]";
var cardBase = `${tk.radius} border ${tk.border} ${tk.bgCard} ${tk.fgCard} ${tk.shadowSm}`;
var panelBase = `${tk.radius} border ${tk.border} ${tk.bgPopover} ${tk.fgPopover} ${tk.shadowLg}`;
var mutedBar = `${tk.bgMutedHalf} ${tk.border}`;
var interactiveRow = `transition-colors ${tk.hoverBgMutedHalf}`;
var ghostControl = `${tk.radiusMd} ${tk.fgMuted} transition-colors ${tk.hoverBgMuted} ${tk.hoverFg} disabled:cursor-not-allowed disabled:opacity-50`;
var textStyles = {
  pageTitle: `text-2xl font-semibold tracking-tight ${tk.fg}`,
  sectionTitle: `text-base font-semibold ${tk.fg}`,
  cardTitle: `text-sm font-semibold ${tk.fg}`,
  body: `text-sm ${tk.fg}`,
  muted: `text-sm ${tk.fgMuted}`,
  caption: `text-xs ${tk.fgMuted}`,
  stat: `text-3xl font-semibold tracking-tight tabular-nums ${tk.fg}`,
  mono: `${tk.fontMono} text-xs`
};
function deriveAccent(accent) {
  const hex = accent && hexToOklch(accent) ? accent : DEFAULT_ACCENT;
  const o = hexToOklch(hex);
  const primary = oklchTriple(o);
  const out = {
    "--rm-accent": hex,
    "--rm-primary": primary,
    "--rm-primary-foreground": contrastForeground(o.l),
    "--rm-ring": primary,
    "--rm-chart-1": primary
  };
  const ramp = accentRamp(o);
  for (const step of RAMP_STEPS) out[`--rm-accent-${step}`] = ramp[step];
  return out;
}
function accentStyle(accent) {
  return deriveAccent(accent);
}
function applyAccent(accent) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  for (const [k, v] of Object.entries(deriveAccent(accent))) el.style.setProperty(k, v);
}
var TOKENS_STYLE_ID = "rm-kit-tokens";
function ensureTokens() {
  if (typeof document === "undefined") return false;
  if (document.getElementById(TOKENS_STYLE_ID)) return false;
  let present = "";
  try {
    present = getComputedStyle(document.documentElement).getPropertyValue("--rm-kit").trim();
  } catch {
  }
  if (present) return false;
  const style = document.createElement("style");
  style.id = TOKENS_STYLE_ID;
  style.setAttribute("data-rm-kit", "tokens");
  style.textContent = TOKENS_CSS;
  document.head.insertBefore(style, document.head.firstChild);
  return true;
}

// src/theme-sync.ts
import { useEffect, useSyncExternalStore } from "react";
var STORAGE_KEY = "rm-theme";
function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.toggle("dark", theme === "dark");
  el.style.colorScheme = theme;
}
function readTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
function setTheme(theme, remember = true) {
  applyTheme(theme);
  if (!remember) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
  }
}
function subscribeTheme(onChange) {
  if (typeof MutationObserver === "undefined" || typeof document === "undefined") return () => void 0;
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
function useTheme() {
  return useSyncExternalStore(subscribeTheme, readTheme, () => "light");
}
function themeWasChosen() {
  if (typeof window === "undefined") return false;
  try {
    const p = new URLSearchParams(window.location.search).get("theme");
    if (p === "dark" || p === "light") return true;
  } catch {
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return true;
  } catch {
  }
  return false;
}
function useThemeBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let chosen = themeWasChosen();
    const onMessage = (event) => {
      const data = event.data;
      if (!data || typeof data !== "object" || data.type !== "rm-theme") return;
      const theme = data.theme === "dark" ? "dark" : data.theme === "light" ? "light" : null;
      if (!theme) return;
      chosen = true;
      applyTheme(theme);
    };
    window.addEventListener("message", onMessage);
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystemChange = (event) => {
      if (chosen) return;
      applyTheme(event.matches ? "dark" : "light");
    };
    mq?.addEventListener?.("change", onSystemChange);
    if (window.parent !== window) {
      try {
        window.parent.postMessage({ type: "rm-theme-ready" }, "*");
      } catch {
      }
    }
    return () => {
      window.removeEventListener("message", onMessage);
      mq?.removeEventListener?.("change", onSystemChange);
    };
  }, []);
}

// src/icons/index.tsx
import { forwardRef, isValidElement } from "react";

// src/icons/data.ts
var ICON_DATA = {
  "home": [["path", { "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }], ["path", { "d": "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }]],
  "layout-dashboard": [["rect", { "width": "7", "height": "9", "x": "3", "y": "3", "rx": "1" }], ["rect", { "width": "7", "height": "5", "x": "14", "y": "3", "rx": "1" }], ["rect", { "width": "7", "height": "9", "x": "14", "y": "12", "rx": "1" }], ["rect", { "width": "7", "height": "5", "x": "3", "y": "16", "rx": "1" }]],
  "list": [["path", { "d": "M3 12h.01" }], ["path", { "d": "M3 18h.01" }], ["path", { "d": "M3 6h.01" }], ["path", { "d": "M8 12h13" }], ["path", { "d": "M8 18h13" }], ["path", { "d": "M8 6h13" }]],
  "table": [["path", { "d": "M12 3v18" }], ["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M3 9h18" }], ["path", { "d": "M3 15h18" }]],
  "kanban": [["path", { "d": "M6 5v11" }], ["path", { "d": "M12 5v6" }], ["path", { "d": "M18 5v14" }]],
  "calendar": [["path", { "d": "M8 2v4" }], ["path", { "d": "M16 2v4" }], ["rect", { "width": "18", "height": "18", "x": "3", "y": "4", "rx": "2" }], ["path", { "d": "M3 10h18" }]],
  "calendar-days": [["path", { "d": "M8 2v4" }], ["path", { "d": "M16 2v4" }], ["rect", { "width": "18", "height": "18", "x": "3", "y": "4", "rx": "2" }], ["path", { "d": "M3 10h18" }], ["path", { "d": "M8 14h.01" }], ["path", { "d": "M12 14h.01" }], ["path", { "d": "M16 14h.01" }], ["path", { "d": "M8 18h.01" }], ["path", { "d": "M12 18h.01" }], ["path", { "d": "M16 18h.01" }]],
  "calendar-clock": [["path", { "d": "M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" }], ["path", { "d": "M16 2v4" }], ["path", { "d": "M8 2v4" }], ["path", { "d": "M3 10h5" }], ["path", { "d": "M17.5 17.5 16 16.3V14" }], ["circle", { "cx": "16", "cy": "16", "r": "6" }]],
  "calendar-check": [["path", { "d": "M8 2v4" }], ["path", { "d": "M16 2v4" }], ["rect", { "width": "18", "height": "18", "x": "3", "y": "4", "rx": "2" }], ["path", { "d": "M3 10h18" }], ["path", { "d": "m9 16 2 2 4-4" }]],
  "clock": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["polyline", { "points": "12 6 12 12 16 14" }]],
  "inbox": [["polyline", { "points": "22 12 16 12 14 15 10 15 8 12 2 12" }], ["path", { "d": "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" }]],
  "mail": [["rect", { "width": "20", "height": "16", "x": "2", "y": "4", "rx": "2" }], ["path", { "d": "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }]],
  "mail-open": [["path", { "d": "M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" }], ["path", { "d": "m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" }]],
  "mail-check": [["path", { "d": "M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" }], ["path", { "d": "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }], ["path", { "d": "m16 19 2 2 4-4" }]],
  "message-square": [["path", { "d": "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }]],
  "message-circle": [["path", { "d": "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" }]],
  "bell": [["path", { "d": "M10.268 21a2 2 0 0 0 3.464 0" }], ["path", { "d": "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" }]],
  "settings": [["path", { "d": "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }], ["circle", { "cx": "12", "cy": "12", "r": "3" }]],
  "sliders-horizontal": [["line", { "x1": "21", "x2": "14", "y1": "4", "y2": "4" }], ["line", { "x1": "10", "x2": "3", "y1": "4", "y2": "4" }], ["line", { "x1": "21", "x2": "12", "y1": "12", "y2": "12" }], ["line", { "x1": "8", "x2": "3", "y1": "12", "y2": "12" }], ["line", { "x1": "21", "x2": "16", "y1": "20", "y2": "20" }], ["line", { "x1": "12", "x2": "3", "y1": "20", "y2": "20" }], ["line", { "x1": "14", "x2": "14", "y1": "2", "y2": "6" }], ["line", { "x1": "8", "x2": "8", "y1": "10", "y2": "14" }], ["line", { "x1": "16", "x2": "16", "y1": "18", "y2": "22" }]],
  "search": [["circle", { "cx": "11", "cy": "11", "r": "8" }], ["path", { "d": "m21 21-4.3-4.3" }]],
  "filter": [["polygon", { "points": "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" }]],
  "filter-x": [["path", { "d": "M13.013 3H2l8 9.46V19l4 2v-8.54l.9-1.055" }], ["path", { "d": "m22 3-5 5" }], ["path", { "d": "m17 3 5 5" }]],
  "menu": [["line", { "x1": "4", "x2": "20", "y1": "12", "y2": "12" }], ["line", { "x1": "4", "x2": "20", "y1": "6", "y2": "6" }], ["line", { "x1": "4", "x2": "20", "y1": "18", "y2": "18" }]],
  "panel-left": [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M9 3v18" }]],
  "panel-left-close": [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M9 3v18" }], ["path", { "d": "m16 15-3-3 3-3" }]],
  "log-in": [["path", { "d": "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" }], ["polyline", { "points": "10 17 15 12 10 7" }], ["line", { "x1": "15", "x2": "3", "y1": "12", "y2": "12" }]],
  "log-out": [["path", { "d": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }], ["polyline", { "points": "16 17 21 12 16 7" }], ["line", { "x1": "21", "x2": "9", "y1": "12", "y2": "12" }]],
  "plus": [["path", { "d": "M5 12h14" }], ["path", { "d": "M12 5v14" }]],
  "minus": [["path", { "d": "M5 12h14" }]],
  "x": [["path", { "d": "M18 6 6 18" }], ["path", { "d": "m6 6 12 12" }]],
  "check": [["path", { "d": "M20 6 9 17l-5-5" }]],
  "check-check": [["path", { "d": "M18 6 7 17l-5-5" }], ["path", { "d": "m22 10-7.5 7.5L13 16" }]],
  "pencil": [["path", { "d": "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }], ["path", { "d": "m15 5 4 4" }]],
  "trash-2": [["path", { "d": "M3 6h18" }], ["path", { "d": "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }], ["path", { "d": "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }], ["line", { "x1": "10", "x2": "10", "y1": "11", "y2": "17" }], ["line", { "x1": "14", "x2": "14", "y1": "11", "y2": "17" }]],
  "copy": [["rect", { "width": "14", "height": "14", "x": "8", "y": "8", "rx": "2", "ry": "2" }], ["path", { "d": "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]],
  "save": [["path", { "d": "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" }], ["path", { "d": "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }], ["path", { "d": "M7 3v4a1 1 0 0 0 1 1h7" }]],
  "refresh-cw": [["path", { "d": "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }], ["path", { "d": "M21 3v5h-5" }], ["path", { "d": "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }], ["path", { "d": "M8 16H3v5" }]],
  "rotate-cw": [["path", { "d": "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }], ["path", { "d": "M21 3v5h-5" }]],
  "undo-2": [["path", { "d": "M9 14 4 9l5-5" }], ["path", { "d": "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" }]],
  "redo-2": [["path", { "d": "m15 14 5-5-5-5" }], ["path", { "d": "M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" }]],
  "play": [["polygon", { "points": "6 3 20 12 6 21 6 3" }]],
  "pause": [["rect", { "x": "14", "y": "4", "width": "4", "height": "16", "rx": "1" }], ["rect", { "x": "6", "y": "4", "width": "4", "height": "16", "rx": "1" }]],
  "square": [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }]],
  "send": [["path", { "d": "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" }], ["path", { "d": "m21.854 2.147-10.94 10.939" }]],
  "reply": [["polyline", { "points": "9 17 4 12 9 7" }], ["path", { "d": "M20 18v-2a4 4 0 0 0-4-4H4" }]],
  "forward": [["polyline", { "points": "15 17 20 12 15 7" }], ["path", { "d": "M4 18v-2a4 4 0 0 1 4-4h12" }]],
  "upload": [["path", { "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }], ["polyline", { "points": "17 8 12 3 7 8" }], ["line", { "x1": "12", "x2": "12", "y1": "3", "y2": "15" }]],
  "download": [["path", { "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }], ["polyline", { "points": "7 10 12 15 17 10" }], ["line", { "x1": "12", "x2": "12", "y1": "15", "y2": "3" }]],
  "cloud-upload": [["path", { "d": "M12 13v8" }], ["path", { "d": "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" }], ["path", { "d": "m8 17 4-4 4 4" }]],
  "import": [["path", { "d": "M12 3v12" }], ["path", { "d": "m8 11 4 4 4-4" }], ["path", { "d": "M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" }]],
  "paperclip": [["path", { "d": "M13.234 20.252 21 12.3" }], ["path", { "d": "m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486" }]],
  "printer": [["path", { "d": "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" }], ["path", { "d": "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" }], ["rect", { "x": "6", "y": "14", "width": "12", "height": "8", "rx": "1" }]],
  "share-2": [["circle", { "cx": "18", "cy": "5", "r": "3" }], ["circle", { "cx": "6", "cy": "12", "r": "3" }], ["circle", { "cx": "18", "cy": "19", "r": "3" }], ["line", { "x1": "8.59", "x2": "15.42", "y1": "13.51", "y2": "17.49" }], ["line", { "x1": "15.41", "x2": "8.59", "y1": "6.51", "y2": "10.49" }]],
  "external-link": [["path", { "d": "M15 3h6v6" }], ["path", { "d": "M10 14 21 3" }], ["path", { "d": "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }]],
  "link": [["path", { "d": "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }], ["path", { "d": "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }]],
  "unlink": [["path", { "d": "m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" }], ["path", { "d": "m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" }], ["line", { "x1": "8", "x2": "8", "y1": "2", "y2": "5" }], ["line", { "x1": "2", "x2": "5", "y1": "8", "y2": "8" }], ["line", { "x1": "16", "x2": "16", "y1": "19", "y2": "22" }], ["line", { "x1": "19", "x2": "22", "y1": "16", "y2": "16" }]],
  "eye": [["path", { "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }], ["circle", { "cx": "12", "cy": "12", "r": "3" }]],
  "eye-off": [["path", { "d": "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" }], ["path", { "d": "M14.084 14.158a3 3 0 0 1-4.242-4.242" }], ["path", { "d": "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" }], ["path", { "d": "m2 2 20 20" }]],
  "maximize-2": [["polyline", { "points": "15 3 21 3 21 9" }], ["polyline", { "points": "9 21 3 21 3 15" }], ["line", { "x1": "21", "x2": "14", "y1": "3", "y2": "10" }], ["line", { "x1": "3", "x2": "10", "y1": "21", "y2": "14" }]],
  "minimize-2": [["polyline", { "points": "4 14 10 14 10 20" }], ["polyline", { "points": "20 10 14 10 14 4" }], ["line", { "x1": "14", "x2": "21", "y1": "10", "y2": "3" }], ["line", { "x1": "3", "x2": "10", "y1": "21", "y2": "14" }]],
  "grip-vertical": [["circle", { "cx": "9", "cy": "12", "r": "1" }], ["circle", { "cx": "9", "cy": "5", "r": "1" }], ["circle", { "cx": "9", "cy": "19", "r": "1" }], ["circle", { "cx": "15", "cy": "12", "r": "1" }], ["circle", { "cx": "15", "cy": "5", "r": "1" }], ["circle", { "cx": "15", "cy": "19", "r": "1" }]],
  "power": [["path", { "d": "M12 2v10" }], ["path", { "d": "M18.4 6.6a9 9 0 1 1-12.77.04" }]],
  "arrow-up": [["path", { "d": "m5 12 7-7 7 7" }], ["path", { "d": "M12 19V5" }]],
  "arrow-down": [["path", { "d": "M12 5v14" }], ["path", { "d": "m19 12-7 7-7-7" }]],
  "arrow-left": [["path", { "d": "m12 19-7-7 7-7" }], ["path", { "d": "M19 12H5" }]],
  "arrow-right": [["path", { "d": "M5 12h14" }], ["path", { "d": "m12 5 7 7-7 7" }]],
  "arrow-up-right": [["path", { "d": "M7 7h10v10" }], ["path", { "d": "M7 17 17 7" }]],
  "arrow-down-right": [["path", { "d": "m7 7 10 10" }], ["path", { "d": "M17 7v10H7" }]],
  "arrow-up-down": [["path", { "d": "m21 16-4 4-4-4" }], ["path", { "d": "M17 20V4" }], ["path", { "d": "m3 8 4-4 4 4" }], ["path", { "d": "M7 4v16" }]],
  "chevron-up": [["path", { "d": "m18 15-6-6-6 6" }]],
  "chevron-down": [["path", { "d": "m6 9 6 6 6-6" }]],
  "chevron-left": [["path", { "d": "m15 18-6-6 6-6" }]],
  "chevron-right": [["path", { "d": "m9 18 6-6-6-6" }]],
  "chevrons-up-down": [["path", { "d": "m7 15 5 5 5-5" }], ["path", { "d": "m7 9 5-5 5 5" }]],
  "chevrons-left": [["path", { "d": "m11 17-5-5 5-5" }], ["path", { "d": "m18 17-5-5 5-5" }]],
  "chevrons-right": [["path", { "d": "m6 17 5-5-5-5" }], ["path", { "d": "m13 17 5-5-5-5" }]],
  "trending-up": [["polyline", { "points": "22 7 13.5 15.5 8.5 10.5 2 17" }], ["polyline", { "points": "16 7 22 7 22 13" }]],
  "trending-down": [["polyline", { "points": "22 17 13.5 8.5 8.5 13.5 2 7" }], ["polyline", { "points": "16 17 22 17 22 11" }]],
  "circle-check": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "m9 12 2 2 4-4" }]],
  "circle-x": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "m15 9-6 6" }], ["path", { "d": "m9 9 6 6" }]],
  "circle-alert": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["line", { "x1": "12", "x2": "12", "y1": "8", "y2": "12" }], ["line", { "x1": "12", "x2": "12.01", "y1": "16", "y2": "16" }]],
  "circle-help": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }], ["path", { "d": "M12 17h.01" }]],
  "circle-minus": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "M8 12h8" }]],
  "circle-plus": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "M8 12h8" }], ["path", { "d": "M12 8v8" }]],
  "triangle-alert": [["path", { "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }], ["path", { "d": "M12 9v4" }], ["path", { "d": "M12 17h.01" }]],
  "info": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "M12 16v-4" }], ["path", { "d": "M12 8h.01" }]],
  "circle": [["circle", { "cx": "12", "cy": "12", "r": "10" }]],
  "circle-dot": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["circle", { "cx": "12", "cy": "12", "r": "1" }]],
  "loader": [["path", { "d": "M12 2v4" }], ["path", { "d": "m16.2 7.8 2.9-2.9" }], ["path", { "d": "M18 12h4" }], ["path", { "d": "m16.2 16.2 2.9 2.9" }], ["path", { "d": "M12 18v4" }], ["path", { "d": "m4.9 19.1 2.9-2.9" }], ["path", { "d": "M2 12h4" }], ["path", { "d": "m4.9 4.9 2.9 2.9" }]],
  "loader-circle": [["path", { "d": "M21 12a9 9 0 1 1-6.219-8.56" }]],
  "hourglass": [["path", { "d": "M5 22h14" }], ["path", { "d": "M5 2h14" }], ["path", { "d": "M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" }], ["path", { "d": "M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" }]],
  "timer": [["line", { "x1": "10", "x2": "14", "y1": "2", "y2": "2" }], ["line", { "x1": "12", "x2": "15", "y1": "14", "y2": "11" }], ["circle", { "cx": "12", "cy": "14", "r": "8" }]],
  "history": [["path", { "d": "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }], ["path", { "d": "M3 3v5h5" }], ["path", { "d": "M12 7v5l4 2" }]],
  "archive": [["rect", { "width": "20", "height": "5", "x": "2", "y": "3", "rx": "1" }], ["path", { "d": "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }], ["path", { "d": "M10 12h4" }]],
  "flag": [["path", { "d": "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }], ["line", { "x1": "4", "x2": "4", "y1": "22", "y2": "15" }]],
  "pin": [["path", { "d": "M12 17v5" }], ["path", { "d": "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" }]],
  "star": [["path", { "d": "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" }]],
  "heart": [["path", { "d": "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" }]],
  "bookmark": [["path", { "d": "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }]],
  "tag": [["path", { "d": "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" }], ["circle", { "cx": "7.5", "cy": "7.5", "r": ".5", "fill": "currentColor" }]],
  "tags": [["path", { "d": "m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" }], ["path", { "d": "M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z" }], ["circle", { "cx": "6.5", "cy": "9.5", "r": ".5", "fill": "currentColor" }]],
  "hash": [["line", { "x1": "4", "x2": "20", "y1": "9", "y2": "9" }], ["line", { "x1": "4", "x2": "20", "y1": "15", "y2": "15" }], ["line", { "x1": "10", "x2": "8", "y1": "3", "y2": "21" }], ["line", { "x1": "16", "x2": "14", "y1": "3", "y2": "21" }]],
  "at-sign": [["circle", { "cx": "12", "cy": "12", "r": "4" }], ["path", { "d": "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" }]],
  "lightbulb": [["path", { "d": "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" }], ["path", { "d": "M9 18h6" }], ["path", { "d": "M10 22h4" }]],
  "target": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["circle", { "cx": "12", "cy": "12", "r": "6" }], ["circle", { "cx": "12", "cy": "12", "r": "2" }]],
  "award": [["path", { "d": "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" }], ["circle", { "cx": "12", "cy": "8", "r": "6" }]],
  "user": [["path", { "d": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }], ["circle", { "cx": "12", "cy": "7", "r": "4" }]],
  "users": [["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { "cx": "9", "cy": "7", "r": "4" }], ["path", { "d": "M22 21v-2a4 4 0 0 0-3-3.87" }], ["path", { "d": "M16 3.13a4 4 0 0 1 0 7.75" }]],
  "user-plus": [["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { "cx": "9", "cy": "7", "r": "4" }], ["line", { "x1": "19", "x2": "19", "y1": "8", "y2": "14" }], ["line", { "x1": "22", "x2": "16", "y1": "11", "y2": "11" }]],
  "user-check": [["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { "cx": "9", "cy": "7", "r": "4" }], ["polyline", { "points": "16 11 18 13 22 9" }]],
  "user-x": [["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { "cx": "9", "cy": "7", "r": "4" }], ["line", { "x1": "17", "x2": "22", "y1": "8", "y2": "13" }], ["line", { "x1": "22", "x2": "17", "y1": "8", "y2": "13" }]],
  "contact": [["path", { "d": "M16 2v2" }], ["path", { "d": "M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" }], ["path", { "d": "M8 2v2" }], ["circle", { "cx": "12", "cy": "11", "r": "3" }], ["rect", { "x": "3", "y": "4", "width": "18", "height": "18", "rx": "2" }]],
  "building-2": [["path", { "d": "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" }], ["path", { "d": "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" }], ["path", { "d": "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" }], ["path", { "d": "M10 6h4" }], ["path", { "d": "M10 10h4" }], ["path", { "d": "M10 14h4" }], ["path", { "d": "M10 18h4" }]],
  "briefcase": [["path", { "d": "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" }], ["rect", { "width": "20", "height": "14", "x": "2", "y": "6", "rx": "2" }]],
  "handshake": [["path", { "d": "m11 17 2 2a1 1 0 1 0 3-3" }], ["path", { "d": "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" }], ["path", { "d": "m21 3 1 11h-2" }], ["path", { "d": "M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" }], ["path", { "d": "M3 4h8" }]],
  "shield": [["path", { "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }]],
  "shield-check": [["path", { "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { "d": "m9 12 2 2 4-4" }]],
  "lock": [["rect", { "width": "18", "height": "11", "x": "3", "y": "11", "rx": "2", "ry": "2" }], ["path", { "d": "M7 11V7a5 5 0 0 1 10 0v4" }]],
  "lock-open": [["rect", { "width": "18", "height": "11", "x": "3", "y": "11", "rx": "2", "ry": "2" }], ["path", { "d": "M7 11V7a5 5 0 0 1 9.9-1" }]],
  "key": [["path", { "d": "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" }], ["path", { "d": "m21 2-9.6 9.6" }], ["circle", { "cx": "7.5", "cy": "15.5", "r": "5.5" }]],
  "folder": [["path", { "d": "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" }]],
  "folder-open": [["path", { "d": "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" }]],
  "file": [["path", { "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }], ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }]],
  "file-text": [["path", { "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }], ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }], ["path", { "d": "M10 9H8" }], ["path", { "d": "M16 13H8" }], ["path", { "d": "M16 17H8" }]],
  "file-plus": [["path", { "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }], ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }], ["path", { "d": "M9 15h6" }], ["path", { "d": "M12 18v-6" }]],
  "file-check": [["path", { "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }], ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }], ["path", { "d": "m9 15 2 2 4-4" }]],
  "file-spreadsheet": [["path", { "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }], ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }], ["path", { "d": "M8 13h2" }], ["path", { "d": "M14 13h2" }], ["path", { "d": "M8 17h2" }], ["path", { "d": "M14 17h2" }]],
  "file-down": [["path", { "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }], ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }], ["path", { "d": "M12 18v-6" }], ["path", { "d": "m9 15 3 3 3-3" }]],
  "file-up": [["path", { "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }], ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }], ["path", { "d": "M12 12v6" }], ["path", { "d": "m15 15-3-3-3 3" }]],
  "clipboard": [["rect", { "width": "8", "height": "4", "x": "8", "y": "2", "rx": "1", "ry": "1" }], ["path", { "d": "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }]],
  "clipboard-check": [["rect", { "width": "8", "height": "4", "x": "8", "y": "2", "rx": "1", "ry": "1" }], ["path", { "d": "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }], ["path", { "d": "m9 14 2 2 4-4" }]],
  "image": [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2", "ry": "2" }], ["circle", { "cx": "9", "cy": "9", "r": "2" }], ["path", { "d": "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }]],
  "database": [["ellipse", { "cx": "12", "cy": "5", "rx": "9", "ry": "3" }], ["path", { "d": "M3 5V19A9 3 0 0 0 21 19V5" }], ["path", { "d": "M3 12A9 3 0 0 0 21 12" }]],
  "server": [["rect", { "width": "20", "height": "8", "x": "2", "y": "2", "rx": "2", "ry": "2" }], ["rect", { "width": "20", "height": "8", "x": "2", "y": "14", "rx": "2", "ry": "2" }], ["line", { "x1": "6", "x2": "6.01", "y1": "6", "y2": "6" }], ["line", { "x1": "6", "x2": "6.01", "y1": "18", "y2": "18" }]],
  "layers": [["path", { "d": "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" }], ["path", { "d": "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" }], ["path", { "d": "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" }]],
  "box": [["path", { "d": "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }], ["path", { "d": "m3.3 7 8.7 5 8.7-5" }], ["path", { "d": "M12 22V12" }]],
  "package": [["path", { "d": "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }], ["path", { "d": "M12 22V12" }], ["polyline", { "points": "3.29 7 12 12 20.71 7" }], ["path", { "d": "m7.5 4.27 9 5.15" }]],
  "shopping-cart": [["circle", { "cx": "8", "cy": "21", "r": "1" }], ["circle", { "cx": "19", "cy": "21", "r": "1" }], ["path", { "d": "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" }]],
  "credit-card": [["rect", { "width": "20", "height": "14", "x": "2", "y": "5", "rx": "2" }], ["line", { "x1": "2", "x2": "22", "y1": "10", "y2": "10" }]],
  "receipt": [["path", { "d": "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" }], ["path", { "d": "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" }], ["path", { "d": "M12 17.5v-11" }]],
  "wallet": [["path", { "d": "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }], ["path", { "d": "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" }]],
  "banknote": [["rect", { "width": "20", "height": "12", "x": "2", "y": "6", "rx": "2" }], ["circle", { "cx": "12", "cy": "12", "r": "2" }], ["path", { "d": "M6 12h.01M18 12h.01" }]],
  "coins": [["circle", { "cx": "8", "cy": "8", "r": "6" }], ["path", { "d": "M18.09 10.37A6 6 0 1 1 10.34 18" }], ["path", { "d": "M7 6h1v4" }], ["path", { "d": "m16.71 13.88.7.71-2.82 2.82" }]],
  "dollar-sign": [["line", { "x1": "12", "x2": "12", "y1": "2", "y2": "22" }], ["path", { "d": "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }]],
  "percent": [["line", { "x1": "19", "x2": "5", "y1": "5", "y2": "19" }], ["circle", { "cx": "6.5", "cy": "6.5", "r": "2.5" }], ["circle", { "cx": "17.5", "cy": "17.5", "r": "2.5" }]],
  "calculator": [["rect", { "width": "16", "height": "20", "x": "4", "y": "2", "rx": "2" }], ["line", { "x1": "8", "x2": "16", "y1": "6", "y2": "6" }], ["line", { "x1": "16", "x2": "16", "y1": "14", "y2": "18" }], ["path", { "d": "M16 10h.01" }], ["path", { "d": "M12 10h.01" }], ["path", { "d": "M8 10h.01" }], ["path", { "d": "M12 14h.01" }], ["path", { "d": "M8 14h.01" }], ["path", { "d": "M12 18h.01" }], ["path", { "d": "M8 18h.01" }]],
  "truck": [["path", { "d": "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" }], ["path", { "d": "M15 18H9" }], ["path", { "d": "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" }], ["circle", { "cx": "17", "cy": "18", "r": "2" }], ["circle", { "cx": "7", "cy": "18", "r": "2" }]],
  "map-pin": [["path", { "d": "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" }], ["circle", { "cx": "12", "cy": "10", "r": "3" }]],
  "map": [["path", { "d": "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" }], ["path", { "d": "M15 5.764v15" }], ["path", { "d": "M9 3.236v15" }]],
  "globe": [["circle", { "cx": "12", "cy": "12", "r": "10" }], ["path", { "d": "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }], ["path", { "d": "M2 12h20" }]],
  "phone": [["path", { "d": "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" }]],
  "landmark": [["line", { "x1": "3", "x2": "21", "y1": "22", "y2": "22" }], ["line", { "x1": "6", "x2": "6", "y1": "18", "y2": "11" }], ["line", { "x1": "10", "x2": "10", "y1": "18", "y2": "11" }], ["line", { "x1": "14", "x2": "14", "y1": "18", "y2": "11" }], ["line", { "x1": "18", "x2": "18", "y1": "18", "y2": "11" }], ["polygon", { "points": "12 2 20 7 4 7" }]],
  "gift": [["rect", { "x": "3", "y": "8", "width": "18", "height": "4", "rx": "1" }], ["path", { "d": "M12 8v13" }], ["path", { "d": "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" }], ["path", { "d": "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" }]],
  "megaphone": [["path", { "d": "m3 11 18-5v12L3 14v-3z" }], ["path", { "d": "M11.6 16.8a3 3 0 1 1-5.8-1.6" }]],
  "chart-bar": [["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }], ["path", { "d": "M7 16h8" }], ["path", { "d": "M7 11h12" }], ["path", { "d": "M7 6h3" }]],
  "chart-line": [["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }], ["path", { "d": "m19 9-5 5-4-4-3 3" }]],
  "chart-pie": [["path", { "d": "M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z" }], ["path", { "d": "M21.21 15.89A10 10 0 1 1 8 2.83" }]],
  "chart-column": [["path", { "d": "M3 3v16a2 2 0 0 0 2 2h16" }], ["path", { "d": "M18 17V9" }], ["path", { "d": "M13 17V5" }], ["path", { "d": "M8 17v-3" }]],
  "activity": [["path", { "d": "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" }]],
  "zap": [["path", { "d": "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" }]],
  "sparkles": [["path", { "d": "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }], ["path", { "d": "M20 3v4" }], ["path", { "d": "M22 5h-4" }], ["path", { "d": "M4 17v2" }], ["path", { "d": "M5 18H3" }]],
  "bot": [["path", { "d": "M12 8V4H8" }], ["rect", { "width": "16", "height": "12", "x": "4", "y": "8", "rx": "2" }], ["path", { "d": "M2 14h2" }], ["path", { "d": "M20 14h2" }], ["path", { "d": "M15 13v2" }], ["path", { "d": "M9 13v2" }]],
  "cpu": [["rect", { "width": "16", "height": "16", "x": "4", "y": "4", "rx": "2" }], ["rect", { "width": "6", "height": "6", "x": "9", "y": "9", "rx": "1" }], ["path", { "d": "M15 2v2" }], ["path", { "d": "M15 20v2" }], ["path", { "d": "M2 15h2" }], ["path", { "d": "M2 9h2" }], ["path", { "d": "M20 15h2" }], ["path", { "d": "M20 9h2" }], ["path", { "d": "M9 2v2" }], ["path", { "d": "M9 20v2" }]],
  "sun": [["circle", { "cx": "12", "cy": "12", "r": "4" }], ["path", { "d": "M12 2v2" }], ["path", { "d": "M12 20v2" }], ["path", { "d": "m4.93 4.93 1.41 1.41" }], ["path", { "d": "m17.66 17.66 1.41 1.41" }], ["path", { "d": "M2 12h2" }], ["path", { "d": "M20 12h2" }], ["path", { "d": "m6.34 17.66-1.41 1.41" }], ["path", { "d": "m19.07 4.93-1.41 1.41" }]],
  "moon": [["path", { "d": "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }]],
  "monitor": [["rect", { "width": "20", "height": "14", "x": "2", "y": "3", "rx": "2" }], ["line", { "x1": "8", "x2": "16", "y1": "21", "y2": "21" }], ["line", { "x1": "12", "x2": "12", "y1": "17", "y2": "21" }]],
  "smartphone": [["rect", { "width": "14", "height": "20", "x": "5", "y": "2", "rx": "2", "ry": "2" }], ["path", { "d": "M12 18h.01" }]],
  "wifi": [["path", { "d": "M12 20h.01" }], ["path", { "d": "M2 8.82a15 15 0 0 1 20 0" }], ["path", { "d": "M5 12.859a10 10 0 0 1 14 0" }], ["path", { "d": "M8.5 16.429a5 5 0 0 1 7 0" }]],
  "wifi-off": [["path", { "d": "M12 20h.01" }], ["path", { "d": "M8.5 16.429a5 5 0 0 1 7 0" }], ["path", { "d": "M5 12.859a10 10 0 0 1 5.17-2.69" }], ["path", { "d": "M19 12.859a10 10 0 0 0-2.007-1.523" }], ["path", { "d": "M2 8.82a15 15 0 0 1 4.177-2.643" }], ["path", { "d": "M22 8.82a15 15 0 0 0-11.288-3.764" }], ["path", { "d": "m2 2 20 20" }]],
  "plug": [["path", { "d": "M12 22v-5" }], ["path", { "d": "M9 8V2" }], ["path", { "d": "M15 8V2" }], ["path", { "d": "M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" }]],
  "qr-code": [["rect", { "width": "5", "height": "5", "x": "3", "y": "3", "rx": "1" }], ["rect", { "width": "5", "height": "5", "x": "16", "y": "3", "rx": "1" }], ["rect", { "width": "5", "height": "5", "x": "3", "y": "16", "rx": "1" }], ["path", { "d": "M21 16h-3a2 2 0 0 0-2 2v3" }], ["path", { "d": "M21 21v.01" }], ["path", { "d": "M12 7v3a2 2 0 0 1-2 2H7" }], ["path", { "d": "M3 12h.01" }], ["path", { "d": "M12 3h.01" }], ["path", { "d": "M12 16v.01" }], ["path", { "d": "M16 12h1" }], ["path", { "d": "M21 12v.01" }], ["path", { "d": "M12 21v-1" }]],
  "scan": [["path", { "d": "M3 7V5a2 2 0 0 1 2-2h2" }], ["path", { "d": "M17 3h2a2 2 0 0 1 2 2v2" }], ["path", { "d": "M21 17v2a2 2 0 0 1-2 2h-2" }], ["path", { "d": "M7 21H5a2 2 0 0 1-2-2v-2" }]],
  "languages": [["path", { "d": "m5 8 6 6" }], ["path", { "d": "m4 14 6-6 2-3" }], ["path", { "d": "M2 5h12" }], ["path", { "d": "M7 2h1" }], ["path", { "d": "m22 22-5-10-5 10" }], ["path", { "d": "M14 18h6" }]],
  "ellipsis": [["circle", { "cx": "12", "cy": "12", "r": "1" }], ["circle", { "cx": "19", "cy": "12", "r": "1" }], ["circle", { "cx": "5", "cy": "12", "r": "1" }]],
  "ellipsis-vertical": [["circle", { "cx": "12", "cy": "12", "r": "1" }], ["circle", { "cx": "12", "cy": "5", "r": "1" }], ["circle", { "cx": "12", "cy": "19", "r": "1" }]],
  "list-checks": [["path", { "d": "m3 17 2 2 4-4" }], ["path", { "d": "m3 7 2 2 4-4" }], ["path", { "d": "M13 6h8" }], ["path", { "d": "M13 12h8" }], ["path", { "d": "M13 18h8" }]],
  "layout-grid": [["rect", { "width": "7", "height": "7", "x": "3", "y": "3", "rx": "1" }], ["rect", { "width": "7", "height": "7", "x": "14", "y": "3", "rx": "1" }], ["rect", { "width": "7", "height": "7", "x": "14", "y": "14", "rx": "1" }], ["rect", { "width": "7", "height": "7", "x": "3", "y": "14", "rx": "1" }]],
  "columns-3": [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M9 3v18" }], ["path", { "d": "M15 3v18" }]],
  "rows-3": [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M21 9H3" }], ["path", { "d": "M21 15H3" }]],
  "columns-2": [["rect", { "width": "18", "height": "18", "x": "3", "y": "3", "rx": "2" }], ["path", { "d": "M12 3v18" }]],
  "image-off": [["line", { "x1": "2", "x2": "22", "y1": "2", "y2": "22" }], ["path", { "d": "M10.41 10.41a2 2 0 1 1-2.83-2.83" }], ["line", { "x1": "13.5", "x2": "6", "y1": "13.5", "y2": "21" }], ["line", { "x1": "18", "x2": "21", "y1": "12", "y2": "15" }], ["path", { "d": "M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" }], ["path", { "d": "M21 15V5a2 2 0 0 0-2-2H9" }]],
  "images": [["path", { "d": "M18 22H4a2 2 0 0 1-2-2V6" }], ["path", { "d": "m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" }], ["circle", { "cx": "12", "cy": "8", "r": "2" }], ["rect", { "width": "16", "height": "16", "x": "6", "y": "2", "rx": "2" }]],
  "crop": [["path", { "d": "M6 2v14a2 2 0 0 0 2 2h14" }], ["path", { "d": "M18 22V8a2 2 0 0 0-2-2H2" }]],
  "scaling": [["path", { "d": "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }], ["path", { "d": "M14 15H9v-5" }], ["path", { "d": "M16 3h5v5" }], ["path", { "d": "M21 3 9 15" }]],
  "zoom-in": [["circle", { "cx": "11", "cy": "11", "r": "8" }], ["line", { "x1": "21", "x2": "16.65", "y1": "21", "y2": "16.65" }], ["line", { "x1": "11", "x2": "11", "y1": "8", "y2": "14" }], ["line", { "x1": "8", "x2": "14", "y1": "11", "y2": "11" }]],
  "zoom-out": [["circle", { "cx": "11", "cy": "11", "r": "8" }], ["line", { "x1": "21", "x2": "16.65", "y1": "21", "y2": "16.65" }], ["line", { "x1": "8", "x2": "14", "y1": "11", "y2": "11" }]],
  "chevrons-left-right": [["path", { "d": "m9 7-5 5 5 5" }], ["path", { "d": "m15 7 5 5-5 5" }]],
  "mouse-pointer-2": [["path", { "d": "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" }]],
  "square-dashed": [["path", { "d": "M5 3a2 2 0 0 0-2 2" }], ["path", { "d": "M19 3a2 2 0 0 1 2 2" }], ["path", { "d": "M21 19a2 2 0 0 1-2 2" }], ["path", { "d": "M5 21a2 2 0 0 1-2-2" }], ["path", { "d": "M9 3h1" }], ["path", { "d": "M9 21h1" }], ["path", { "d": "M14 3h1" }], ["path", { "d": "M14 21h1" }], ["path", { "d": "M3 9v1" }], ["path", { "d": "M21 9v1" }], ["path", { "d": "M3 14v1" }], ["path", { "d": "M21 14v1" }]],
  "move-up-right": [["path", { "d": "M13 5H19V11" }], ["path", { "d": "M19 5L5 19" }]],
  "pen-line": [["path", { "d": "M12 20h9" }], ["path", { "d": "M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" }]],
  "brush": [["path", { "d": "m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" }], ["path", { "d": "M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" }]],
  "eraser": [["path", { "d": "m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" }], ["path", { "d": "M22 21H7" }], ["path", { "d": "m5 11 9 9" }]],
  "message-circle-plus": [["path", { "d": "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" }], ["path", { "d": "M8 12h8" }], ["path", { "d": "M12 8v8" }]],
  "circle-dashed": [["path", { "d": "M10.1 2.182a10 10 0 0 1 3.8 0" }], ["path", { "d": "M13.9 21.818a10 10 0 0 1-3.8 0" }], ["path", { "d": "M17.609 3.721a10 10 0 0 1 2.69 2.7" }], ["path", { "d": "M2.182 13.9a10 10 0 0 1 0-3.8" }], ["path", { "d": "M20.279 17.609a10 10 0 0 1-2.7 2.69" }], ["path", { "d": "M21.818 10.1a10 10 0 0 1 0 3.8" }], ["path", { "d": "M3.721 6.391a10 10 0 0 1 2.7-2.69" }], ["path", { "d": "M6.391 20.279a10 10 0 0 1-2.69-2.7" }]]
};

// src/icons/names.ts
var ICON_NAMES = [
  // Navigation
  "home",
  "layout-dashboard",
  "list",
  "table",
  "kanban",
  "calendar",
  "calendar-days",
  "calendar-clock",
  "calendar-check",
  "clock",
  "inbox",
  "mail",
  "mail-open",
  "mail-check",
  "message-square",
  "message-circle",
  "bell",
  "settings",
  "sliders-horizontal",
  "search",
  "filter",
  "filter-x",
  "menu",
  "panel-left",
  "panel-left-close",
  "log-in",
  "log-out",
  // Actions
  "plus",
  "minus",
  "x",
  "check",
  "check-check",
  "pencil",
  "trash-2",
  "copy",
  "save",
  "refresh-cw",
  "rotate-cw",
  "undo-2",
  "redo-2",
  "play",
  "pause",
  "square",
  "send",
  "reply",
  "forward",
  "upload",
  "download",
  "cloud-upload",
  "import",
  "paperclip",
  "printer",
  "share-2",
  "external-link",
  "link",
  "unlink",
  "eye",
  "eye-off",
  "maximize-2",
  "minimize-2",
  "grip-vertical",
  "power",
  // Arrows, chevrons, trends
  "arrow-up",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "arrow-up-right",
  "arrow-down-right",
  "arrow-up-down",
  "chevron-up",
  "chevron-down",
  "chevron-left",
  "chevron-right",
  "chevrons-up-down",
  "chevrons-left",
  "chevrons-right",
  "trending-up",
  "trending-down",
  // Status
  "circle-check",
  "circle-x",
  "circle-alert",
  "circle-help",
  "circle-minus",
  "circle-plus",
  "triangle-alert",
  "info",
  "circle",
  "circle-dot",
  "loader",
  "loader-circle",
  "hourglass",
  "timer",
  "history",
  "archive",
  "flag",
  "pin",
  "star",
  "heart",
  "bookmark",
  "tag",
  "tags",
  "hash",
  "at-sign",
  "lightbulb",
  "target",
  "award",
  // People and organisations
  "user",
  "users",
  "user-plus",
  "user-check",
  "user-x",
  "contact",
  "building-2",
  "briefcase",
  "handshake",
  "shield",
  "shield-check",
  "lock",
  "lock-open",
  "key",
  // Files and data
  "folder",
  "folder-open",
  "file",
  "file-text",
  "file-plus",
  "file-check",
  "file-spreadsheet",
  "file-down",
  "file-up",
  "clipboard",
  "clipboard-check",
  "image",
  "database",
  "server",
  "layers",
  "box",
  "package",
  // Commerce and places
  "shopping-cart",
  "credit-card",
  "receipt",
  "wallet",
  "banknote",
  "coins",
  "dollar-sign",
  "percent",
  "calculator",
  "truck",
  "map-pin",
  "map",
  "globe",
  "phone",
  "landmark",
  "gift",
  "megaphone",
  // Charts and machines
  "chart-bar",
  "chart-line",
  "chart-pie",
  "chart-column",
  "activity",
  "zap",
  "sparkles",
  "bot",
  "cpu",
  // Devices and theme
  "sun",
  "moon",
  "monitor",
  "smartphone",
  "wifi",
  "wifi-off",
  "plug",
  "qr-code",
  "scan",
  "languages",
  // Layout
  "ellipsis",
  "ellipsis-vertical",
  "list-checks",
  "layout-grid",
  "columns-3",
  "rows-3",
  "columns-2",
  // Pictures and marking them up
  "image-off",
  "images",
  "crop",
  "scaling",
  "zoom-in",
  "zoom-out",
  "chevrons-left-right",
  "mouse-pointer-2",
  "square-dashed",
  "move-up-right",
  "pen-line",
  "brush",
  "eraser",
  "message-circle-plus",
  "circle-dashed"
];
var ICON_ALIASES = {
  "alert-circle": "circle-alert",
  "alert-triangle": "triangle-alert",
  "check-circle": "circle-check",
  "x-circle": "circle-x",
  "help-circle": "circle-help",
  "minus-circle": "circle-minus",
  "plus-circle": "circle-plus",
  "more-horizontal": "ellipsis",
  "more-vertical": "ellipsis-vertical",
  "bar-chart": "chart-bar",
  "line-chart": "chart-line",
  "pie-chart": "chart-pie",
  "loader-2": "loader-circle",
  unlock: "lock-open",
  edit: "pencil",
  trash: "trash-2",
  "table-2": "table",
  spinner: "loader-circle",
  dashboard: "layout-dashboard",
  grid: "layout-grid",
  board: "kanban",
  dots: "ellipsis",
  close: "x",
  add: "plus",
  delete: "trash-2",
  remove: "minus",
  warning: "triangle-alert",
  error: "circle-x",
  success: "circle-check",
  question: "circle-help",
  person: "user",
  people: "users",
  email: "mail",
  attachment: "paperclip",
  refresh: "refresh-cw",
  sort: "arrow-up-down",
  drag: "grip-vertical",
  expand: "maximize-2",
  collapse: "minimize-2",
  logout: "log-out",
  login: "log-in",
  cart: "shopping-cart",
  money: "banknote",
  location: "map-pin",
  chart: "chart-bar",
  robot: "bot",
  ai: "sparkles",
  light: "sun",
  dark: "moon",
  settings2: "sliders-horizontal",
  "settings-2": "sliders-horizontal"
};

// src/icons/index.tsx
import { jsx } from "react/jsx-runtime";
var SIZES = {
  12: "h-3 w-3",
  14: "h-3.5 w-3.5",
  16: "h-4 w-4",
  18: "h-[18px] w-[18px]",
  20: "h-5 w-5",
  24: "h-6 w-6",
  28: "h-7 w-7",
  32: "h-8 w-8"
};
function resolveIconName(name) {
  if (ICON_NAMES.includes(name)) return name;
  return ICON_ALIASES[name] ?? null;
}
var Icon = forwardRef(function Icon2({ name, size: size3 = 16, strokeWidth = 2, label, className, ...props }, ref) {
  const resolved = resolveIconName(name);
  const nodes = resolved ? ICON_DATA[resolved] : [];
  return /* @__PURE__ */ jsx(
    "svg",
    {
      ref,
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": label ? void 0 : "true",
      role: label ? "img" : void 0,
      "aria-label": label,
      "data-rm-icon": resolved ?? name,
      className: cn("shrink-0", SIZES[size3] ?? SIZES[16], className),
      ...props,
      children: nodes.map(([tag, attrs], i) => {
        const Tag = tag;
        return /* @__PURE__ */ jsx(Tag, { ...attrs }, i);
      })
    }
  );
});
var warnedIcons = /* @__PURE__ */ new Set();
function warnUnknownIcon(name) {
  if (warnedIcons.has(name)) return;
  warnedIcons.add(name);
  if (typeof console !== "undefined") console.warn(`[app-kit] "${name}" is not a kit icon; drawing circle-dot. See the Icons list in the kit reference.`);
}
function renderIcon(icon, size3 = 16, className) {
  if (icon === void 0 || icon === null || icon === false) return null;
  if (typeof icon === "string") {
    if (resolveIconName(icon)) return /* @__PURE__ */ jsx(Icon, { name: icon, size: size3, className });
    if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(icon)) {
      warnUnknownIcon(icon);
      return /* @__PURE__ */ jsx(Icon, { name: "circle-dot", size: size3, className });
    }
    return icon;
  }
  if (isValidElement(icon)) return icon;
  return icon;
}

// src/components/app-shell.tsx
import {
  useCallback as useCallback2,
  useEffect as useEffect6,
  useLayoutEffect as useLayoutEffect3,
  useMemo,
  useState as useState5
} from "react";

// src/components/connection-banner.tsx
import { useEffect as useEffect2, useLayoutEffect, useState, useSyncExternalStore as useSyncExternalStore2 } from "react";
import { useMaybeAppClient } from "@robomotion/apps-runtime/react";

// src/components/button.tsx
import { forwardRef as forwardRef2 } from "react";

// node_modules/class-variance-authority/dist/index.mjs
var falsyToString = (value) => typeof value === "boolean" ? `${value}` : value === 0 ? "0" : value;
var cx = clsx;
var cva = (base2, config) => (props) => {
  var _config_compoundVariants;
  if ((config === null || config === void 0 ? void 0 : config.variants) == null) return cx(base2, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
  const { variants, defaultVariants } = config;
  const getVariantClassNames = Object.keys(variants).map((variant) => {
    const variantProp = props === null || props === void 0 ? void 0 : props[variant];
    const defaultVariantProp = defaultVariants === null || defaultVariants === void 0 ? void 0 : defaultVariants[variant];
    if (variantProp === null) return null;
    const variantKey = falsyToString(variantProp) || falsyToString(defaultVariantProp);
    return variants[variant][variantKey];
  });
  const propsWithoutUndefined = props && Object.entries(props).reduce((acc, param) => {
    let [key, value] = param;
    if (value === void 0) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
  const getCompoundVariantClassNames = config === null || config === void 0 ? void 0 : (_config_compoundVariants = config.compoundVariants) === null || _config_compoundVariants === void 0 ? void 0 : _config_compoundVariants.reduce((acc, param) => {
    let { class: cvClass, className: cvClassName, ...compoundVariantOptions } = param;
    return Object.entries(compoundVariantOptions).every((param2) => {
      let [key, value] = param2;
      return Array.isArray(value) ? value.includes({
        ...defaultVariants,
        ...propsWithoutUndefined
      }[key]) : {
        ...defaultVariants,
        ...propsWithoutUndefined
      }[key] === value;
    }) ? [
      ...acc,
      cvClass,
      cvClassName
    ] : acc;
  }, []);
  return cx(base2, getVariantClassNames, getCompoundVariantClassNames, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
};

// src/action.ts
import { announceWriteDone, onWriteDone } from "@robomotion/apps-runtime/react";
function resolveParams(params, event) {
  return typeof params === "function" ? params(event) : params;
}
function joinNames(names) {
  const out = [];
  for (const n of names) {
    if (n && !out.includes(n)) out.push(n);
  }
  return out.length ? out.join(" ") : void 0;
}
var announceActionDone = announceWriteDone;
var onActionDone = onWriteDone;
function runAction(action, params) {
  return Promise.resolve(action.run(params)).then(
    (value) => {
      announceActionDone(action.name);
      return value;
    },
    (err) => {
      announceActionDone(action.name);
      throw err;
    }
  );
}

// src/components/button.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors",
    tk.radiusMd,
    "disabled:pointer-events-none disabled:opacity-50",
    focusRing
  ),
  {
    variants: {
      variant: {
        primary: cn(tk.bgPrimary, tk.fgOnPrimary, tk.shadowSm, "hover:brightness-95 active:brightness-90"),
        secondary: cn("border", tk.borderInput, tk.bgCard, tk.fg, tk.shadowSm, tk.hoverBgMutedHalf),
        outline: cn("border", tk.borderInput, "bg-transparent", tk.fg, tk.hoverBgMutedHalf),
        ghost: cn(tk.fgMuted, tk.hoverBgMuted, tk.hoverFg),
        danger: cn(tk.bgDestructive, tk.fgOnDestructive, tk.shadowSm, "hover:brightness-95 active:brightness-90")
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-sm",
        icon: "h-9 w-9 p-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);
var Button = forwardRef2(function Button2({ className, variant, size: size3, loading, disabled, children, type, action, params, onClick, icon, iconRight, ...props }, ref) {
  const busy = loading ?? action?.loading ?? false;
  const handleClick = action ? (e) => {
    onClick?.(e);
    void runAction(action, resolveParams(params, e)).catch(() => void 0);
  } : onClick;
  const iconSize = size3 === "sm" ? 14 : 16;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ref,
      type: type ?? "button",
      className: cn(buttonVariants({ variant, size: size3 }), className),
      disabled: disabled || busy,
      "aria-busy": busy || void 0,
      "data-rm-action": action?.name,
      onClick: handleClick,
      ...props,
      children: [
        busy ? /* @__PURE__ */ jsx2(Spinner, {}) : renderIcon(icon, iconSize),
        children,
        renderIcon(iconRight, iconSize)
      ]
    }
  );
});
function Spinner({ className }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      className: cn("h-4 w-4 animate-spin", className),
      viewBox: "0 0 24 24",
      fill: "none",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx2(
          "circle",
          {
            className: "opacity-25",
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            strokeWidth: "4"
          }
        ),
        /* @__PURE__ */ jsx2(
          "path",
          {
            className: "opacity-75",
            fill: "currentColor",
            d: "M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
          }
        )
      ]
    }
  );
}

// src/components/connection-banner.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var order = [];
var listeners = /* @__PURE__ */ new Set();
function emit() {
  for (const l of listeners) l();
}
function subscribe(l) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
var useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect2 : useLayoutEffect;
function useOwnsBannerSlot() {
  const [id] = useState(() => /* @__PURE__ */ Symbol("connection-banner"));
  useIsomorphicLayoutEffect(() => {
    order.push(id);
    emit();
    return () => {
      const i = order.indexOf(id);
      if (i >= 0) order.splice(i, 1);
      emit();
    };
  }, [id]);
  return useSyncExternalStore2(
    subscribe,
    () => order.length === 0 || order[0] === id,
    () => true
  );
}
function ConnectionBanner({ state, className }) {
  const owns = useOwnsBannerSlot();
  if (!owns) return null;
  if (state !== void 0) return /* @__PURE__ */ jsx3(BannerView, { state, className });
  return /* @__PURE__ */ jsx3(AutoBanner, { className });
}
function AutoBanner({ className }) {
  const app = useMaybeAppClient();
  const [state, setState] = useState(app?.connection.state);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);
  useEffect2(() => {
    if (!app) return;
    setState(app.connection.state);
    return app.connection.onChange(setState);
  }, [app]);
  const onStart = app && typeof app.startBackend === "function" ? async () => {
    setStarting(true);
    setStartError(null);
    try {
      await app.startBackend();
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "This app could not be started.");
    } finally {
      setStarting(false);
    }
  } : void 0;
  if (!app || state === void 0) return null;
  return /* @__PURE__ */ jsx3(
    BannerView,
    {
      state,
      className,
      onStart,
      starting,
      startError,
      mismatch: app.connection.mismatch ?? void 0
    }
  );
}
var TONE = {
  warning: { strip: cn(tk.bgWarningSoft, tk.borderWarningSoft), icon: tk.fgWarning },
  danger: { strip: cn(tk.bgDestructiveSoft, tk.borderDestructiveSoft), icon: tk.fgDestructive },
  info: { strip: cn(tk.bgInfoSoft, tk.borderInfoSoft), icon: tk.fgInfo }
};
function useBackendUpdate() {
  const [update, setUpdate] = useState({ phase: "idle" });
  useEffect2(() => {
    if (typeof window === "undefined") return;
    const onUpdating = () => setUpdate({ phase: "updating" });
    const onUpdated = (e) => {
      const d = e.detail ?? {};
      if (d.ok) {
        try {
          window.location.reload();
        } catch {
        }
        return;
      }
      setUpdate({ phase: "failed", message: d.message || "The app could not be updated." });
    };
    window.addEventListener("rm:backend-updating", onUpdating);
    window.addEventListener("rm:backend-updated", onUpdated);
    return () => {
      window.removeEventListener("rm:backend-updating", onUpdating);
      window.removeEventListener("rm:backend-updated", onUpdated);
    };
  }, []);
  return update;
}
function BannerView({
  state,
  className,
  onStart,
  starting,
  startError,
  mismatch
}) {
  const update = useBackendUpdate();
  if (state === "ready" || state === "connecting") return null;
  if (state === "app_not_running") {
    return /* @__PURE__ */ jsxs2(
      "div",
      {
        role: "status",
        className: cn(
          "flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-left",
          TONE.warning.strip,
          className
        ),
        children: [
          /* @__PURE__ */ jsxs2("p", { className: cn("flex items-center gap-2 text-sm font-medium", tk.fg), children: [
            /* @__PURE__ */ jsx3(Icon, { name: "circle-alert", size: 16, className: TONE.warning.icon }),
            startError ?? "This app isn't running, so nothing on this page will respond yet."
          ] }),
          onStart ? /* @__PURE__ */ jsx3(Button, { variant: "secondary", size: "sm", disabled: starting, onClick: onStart, children: starting ? "Starting\u2026" : "Start it" }) : null
        ]
      }
    );
  }
  if (state === "contract_mismatch") {
    const otherApp = mismatch?.reason === "other_app";
    const tone2 = otherApp ? TONE.warning : TONE.danger;
    return /* @__PURE__ */ jsxs2(
      "div",
      {
        role: "alert",
        className: cn(
          "flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-left",
          tone2.strip,
          className
        ),
        children: [
          /* @__PURE__ */ jsxs2("p", { className: cn("flex items-center gap-2 text-sm font-medium", tk.fg), children: [
            /* @__PURE__ */ jsx3(Icon, { name: "circle-alert", size: 16, className: tone2.icon }),
            update.phase === "updating" ? "The app's screens are newer than the robot is running. Updating\u2026" : update.phase === "failed" ? update.message : mismatch?.message ?? "This app was updated. Reload the page to continue."
          ] }),
          otherApp ? (
            // Starting this app IS the fix, and it is one press when the page
            // can do it. Reload is not offered at all: it is the loop.
            onStart ? /* @__PURE__ */ jsx3(Button, { variant: "secondary", size: "sm", disabled: starting, onClick: onStart, children: starting ? "Starting\u2026" : "Start this app" }) : null
          ) : update.phase === "updating" ? (
            // The host is restarting the robot's side on the saved screens;
            // the page reloads by itself when it says so. No Reload: that was
            // the loop.
            /* @__PURE__ */ jsxs2("span", { className: cn("flex items-center gap-2 text-sm", tk.fgMuted), children: [
              /* @__PURE__ */ jsx3(Spinner, {}),
              "Updating\u2026"
            ] })
          ) : /* @__PURE__ */ jsx3(
            Button,
            {
              variant: "danger",
              size: "sm",
              onClick: () => {
                if (typeof window !== "undefined") window.location.reload();
              },
              children: "Reload"
            }
          )
        ]
      }
    );
  }
  let message;
  let tone;
  let glyph;
  let spin = false;
  if (state === "robot_offline") {
    message = "The robot for this app is offline. Waiting for it to come back.";
    tone = TONE.danger;
    glyph = "circle-alert";
  } else if (state === "unconfigured") {
    message = "Not connected to your robot yet. The screens below show sample data.";
    tone = TONE.info;
    glyph = "info";
  } else {
    message = "Connection lost. Reconnecting.";
    tone = TONE.warning;
    glyph = "loader-circle";
    spin = true;
  }
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      role: "status",
      className: cn("flex items-center gap-2 border-b px-4 py-2.5 text-left", tone.strip, className),
      children: [
        /* @__PURE__ */ jsx3(Icon, { name: glyph, size: 16, className: cn(tone.icon, spin && "animate-spin") }),
        /* @__PURE__ */ jsx3("p", { className: cn("text-sm font-medium", tk.fg), children: message })
      ]
    }
  );
}

// src/components/drawer.tsx
import { useId as useId2 } from "react";

// src/motion.ts
import { useEffect as useEffect3, useLayoutEffect as useLayoutEffect2, useRef, useState as useState2 } from "react";
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect3 : useLayoutEffect2;
function animates(el) {
  if (!el || typeof getComputedStyle !== "function") return false;
  try {
    const cs = getComputedStyle(el);
    const name = cs.animationName;
    const duration = parseFloat(cs.animationDuration || "0");
    return Boolean(name) && name !== "none" && duration > 0;
  } catch {
    return false;
  }
}
function usePresence(open) {
  const [present, setPresent] = useState2(open);
  const [state, setState] = useState2(open ? "open" : "closed");
  const elRef = useRef(null);
  useIsoLayoutEffect(() => {
    if (open) {
      setPresent(true);
      setState("open");
      return;
    }
    const el = elRef.current;
    el?.setAttribute("data-state", "closed");
    if (!animates(el)) {
      setPresent(false);
      setState("closed");
      return;
    }
    setState("closed");
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setPresent(false);
    };
    const onEnd = (e) => {
      if (e.target === el) finish();
    };
    el?.addEventListener("animationend", onEnd);
    el?.addEventListener("animationcancel", onEnd);
    const timer = window.setTimeout(finish, 400);
    return () => {
      el?.removeEventListener("animationend", onEnd);
      el?.removeEventListener("animationcancel", onEnd);
      clearTimeout(timer);
    };
  }, [open]);
  return {
    present,
    state,
    ref: (el) => {
      elRef.current = el;
    }
  };
}
function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
function canAnimate(el) {
  if (!el || typeof requestAnimationFrame !== "function" || prefersReducedMotion()) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 || r.height > 0;
}

// src/components/dialog.tsx
import {
  useCallback,
  useEffect as useEffect4,
  useId,
  useRef as useRef2,
  useState as useState3
} from "react";
import { createPortal } from "react-dom";
import { Fragment, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function focusableIn(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}
var scrollLocks = 0;
function useOverlay(open, onClose) {
  const panelRef = useRef2(null);
  const openerRef = useRef2(null);
  useEffect4(() => {
    if (!open) return;
    openerRef.current = document.activeElement ?? null;
    const first = focusableIn(panelRef.current)[0] ?? panelRef.current;
    first?.focus();
    scrollLocks += 1;
    const previousOverflow = document.body.style.overflow;
    if (scrollLocks === 1) document.body.style.overflow = "hidden";
    const opener = openerRef.current;
    return () => {
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [open]);
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items2 = focusableIn(panelRef.current);
      if (items2.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items2[0];
      const last = items2[items2.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );
  return { panelRef, onKeyDown };
}
function OverlayPortal({ children }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
var overlayBackdrop = "fixed inset-0 z-40 bg-[color:oklch(0.2_0.02_260/0.4)] backdrop-blur-[1px] dark:bg-black/60";
var SIZES2 = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl"
};
function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  size: size3 = "md",
  hideClose = false,
  static: isStatic = false,
  className,
  children
}) {
  const { panelRef, onKeyDown } = useOverlay(open, onClose);
  const presence = usePresence(open);
  const id = useId();
  if (!presence.present) return null;
  return /* @__PURE__ */ jsxs3(OverlayPortal, { children: [
    /* @__PURE__ */ jsx4(
      "div",
      {
        className: overlayBackdrop,
        "data-rm-anim": "backdrop",
        "data-state": presence.state,
        onClick: isStatic ? void 0 : onClose
      }
    ),
    /* @__PURE__ */ jsx4("div", { className: "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4", children: /* @__PURE__ */ jsxs3(
      "div",
      {
        ref: (el) => {
          panelRef.current = el;
          presence.ref(el);
        },
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": title !== void 0 ? `${id}-title` : void 0,
        "aria-describedby": description !== void 0 ? `${id}-desc` : void 0,
        tabIndex: -1,
        onKeyDown,
        "data-rm-anim": "dialog",
        "data-state": presence.state,
        className: cn(
          "w-full border text-left outline-none",
          tk.radiusLg,
          tk.border,
          tk.bgCard,
          tk.fgCard,
          tk.shadowLg,
          SIZES2[size3],
          className
        ),
        children: [
          (title !== void 0 || !hideClose) && /* @__PURE__ */ jsxs3("div", { className: cn("flex items-start gap-3 border-b px-5 py-4", tk.border), children: [
            /* @__PURE__ */ jsxs3("div", { className: "min-w-0 flex-1", children: [
              title !== void 0 && /* @__PURE__ */ jsx4("h2", { id: `${id}-title`, className: textStyles.sectionTitle, children: title }),
              description !== void 0 && /* @__PURE__ */ jsx4("p", { id: `${id}-desc`, className: cn("mt-1", textStyles.muted), children: description })
            ] }),
            !hideClose && /* @__PURE__ */ jsx4(CloseButton, { onClick: onClose })
          ] }),
          children !== void 0 && /* @__PURE__ */ jsx4("div", { className: cn("px-5 py-4 text-sm", tk.fg), children }),
          footer !== void 0 && /* @__PURE__ */ jsx4(
            "div",
            {
              className: cn(
                "flex items-center justify-end gap-2 rounded-b-[calc(var(--rm-radius)_+_0.25rem)] border-t px-5 py-3",
                mutedBar
              ),
              children: footer
            }
          )
        ]
      }
    ) })
  ] });
}
function CloseButton({ onClick, label = "Close" }) {
  return /* @__PURE__ */ jsx4(
    "button",
    {
      type: "button",
      "aria-label": label,
      onClick,
      className: cn("-mr-1 shrink-0 p-1", ghostControl, focusRing),
      children: /* @__PURE__ */ jsx4(Icon, { name: "x", size: 16 })
    }
  );
}
function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  action,
  params,
  onConfirm,
  children
}) {
  const [busy, setBusy] = useState3(false);
  useEffect4(() => {
    if (!open) setBusy(false);
  }, [open]);
  const confirm = () => {
    onConfirm?.();
    if (!action) {
      onClose();
      return;
    }
    setBusy(true);
    void runAction(action, resolveParams(params, void 0)).catch(() => void 0).finally(() => {
      setBusy(false);
      onClose();
    });
  };
  return /* @__PURE__ */ jsx4(
    Dialog,
    {
      open,
      onClose: busy ? () => void 0 : onClose,
      static: busy,
      hideClose: busy,
      size: "sm",
      title,
      description,
      footer: /* @__PURE__ */ jsxs3(Fragment, { children: [
        /* @__PURE__ */ jsx4(Button, { variant: "secondary", onClick: onClose, disabled: busy, children: cancelLabel }),
        /* @__PURE__ */ jsx4(
          Button,
          {
            variant: danger ? "danger" : "primary",
            loading: busy,
            onClick: confirm,
            ...{ "data-rm-action": action?.name },
            children: confirmLabel
          }
        )
      ] }),
      children
    }
  );
}

// src/components/drawer.tsx
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
var WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl"
};
function Drawer({
  open,
  onClose,
  title,
  description,
  side = "right",
  size: size3 = "md",
  footer,
  hideClose = false,
  className,
  children
}) {
  const { panelRef, onKeyDown } = useOverlay(open, onClose);
  const presence = usePresence(open);
  const id = useId2();
  if (!presence.present) return null;
  return /* @__PURE__ */ jsxs4(OverlayPortal, { children: [
    /* @__PURE__ */ jsx5("div", { className: overlayBackdrop, "data-rm-anim": "backdrop", "data-state": presence.state, onClick: onClose }),
    /* @__PURE__ */ jsx5(
      "div",
      {
        className: cn(
          "fixed inset-y-0 z-50 flex w-full p-0",
          side === "right" ? "right-0 justify-end" : "left-0 justify-start",
          WIDTHS[size3]
        ),
        children: /* @__PURE__ */ jsxs4(
          "div",
          {
            ref: (el) => {
              panelRef.current = el;
              presence.ref(el);
            },
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": title !== void 0 ? `${id}-title` : void 0,
            "aria-describedby": description !== void 0 ? `${id}-desc` : void 0,
            tabIndex: -1,
            onKeyDown,
            "data-rm-anim": side === "right" ? "drawer-right" : "drawer-left",
            "data-state": presence.state,
            className: cn(
              "flex h-full w-full flex-col text-left outline-none",
              tk.bgCard,
              tk.fgCard,
              tk.shadowLg,
              tk.border,
              side === "right" ? "border-l" : "border-r",
              className
            ),
            children: [
              (title !== void 0 || !hideClose) && /* @__PURE__ */ jsxs4("div", { className: cn("flex items-start gap-3 border-b px-5 py-4", tk.border), children: [
                /* @__PURE__ */ jsxs4("div", { className: "min-w-0 flex-1", children: [
                  title !== void 0 && /* @__PURE__ */ jsx5("h2", { id: `${id}-title`, className: textStyles.sectionTitle, children: title }),
                  description !== void 0 && /* @__PURE__ */ jsx5("p", { id: `${id}-desc`, className: cn("mt-1", textStyles.muted), children: description })
                ] }),
                !hideClose && /* @__PURE__ */ jsx5(CloseButton, { onClick: onClose })
              ] }),
              /* @__PURE__ */ jsx5("div", { className: cn("flex-1 overflow-y-auto px-5 py-4 text-sm", tk.fg), children }),
              footer !== void 0 && /* @__PURE__ */ jsx5("div", { className: cn("flex items-center justify-end gap-2 border-t px-5 py-3", mutedBar), children: footer })
            ]
          }
        )
      }
    )
  ] });
}

// src/components/shell-context.ts
import { createContext } from "react";
var ShellContext = createContext(null);

// src/components/theme-toggle.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
function ThemeToggle({ showLabel = false, className }) {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? "Switch to light" : "Switch to dark";
  return /* @__PURE__ */ jsxs5(
    "button",
    {
      type: "button",
      "aria-label": label,
      title: label,
      onClick: () => setTheme(next),
      className: cn("inline-flex h-8 items-center gap-2 px-2 text-sm", ghostControl, focusRing, className),
      children: [
        /* @__PURE__ */ jsx6(Icon, { name: theme === "dark" ? "sun" : "moon", size: 16 }),
        showLabel && /* @__PURE__ */ jsx6("span", { children: theme === "dark" ? "Light" : "Dark" })
      ]
    }
  );
}

// src/components/toast.tsx
import { useEffect as useEffect5, useState as useState4 } from "react";
import { currentCause, splitLinkKey } from "@robomotion/apps-runtime";
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
function causeAttrs(cause) {
  if (!cause) return {};
  const { ns, name } = splitLinkKey(cause);
  return { [`data-rm-${ns}`]: name };
}
var items = [];
var counter = 0;
var listeners2 = /* @__PURE__ */ new Set();
var timers = /* @__PURE__ */ new Map();
function emit2() {
  for (const l of listeners2) l(items);
}
function toast(opts) {
  const id = `toast-${++counter}`;
  let cause;
  try {
    cause = currentCause()?.key;
  } catch {
  }
  const item = { variant: "default", ...opts, id, cause };
  items = [...items, item];
  emit2();
  const duration = opts.durationMs ?? 5e3;
  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => dismissToast(id), duration)
    );
  }
  return id;
}
function dismissToast(id) {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
  const before = items.length;
  items = items.filter((i) => i.id !== id);
  if (items.length !== before) emit2();
}
function useToast() {
  return { toast, dismiss: dismissToast };
}
var VARIANT_ICON = {
  default: { glyph: null, className: "" },
  success: { glyph: "circle-check", className: tk.fgSuccess },
  error: { glyph: "circle-alert", className: tk.fgDestructive }
};
function Toast({ className }) {
  const [list, setList] = useState4(items);
  useEffect5(() => {
    const listener = (l) => setList(l);
    listeners2.add(listener);
    setList(items);
    return () => {
      listeners2.delete(listener);
    };
  }, []);
  if (list.length === 0) return null;
  return /* @__PURE__ */ jsx7(
    "div",
    {
      "aria-live": "polite",
      "aria-label": "Notifications",
      className: cn(
        "pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2",
        className
      ),
      children: list.map((item) => {
        const v = VARIANT_ICON[item.variant];
        return /* @__PURE__ */ jsxs6(
          "div",
          {
            role: "status",
            "data-rm-anim": "toast",
            "data-state": "open",
            "data-variant": item.variant,
            className: cn("pointer-events-auto flex items-start gap-3 p-3 text-left", panelBase),
            ...causeAttrs(item.cause),
            children: [
              v.glyph && /* @__PURE__ */ jsx7(Icon, { name: v.glyph, size: 18, className: cn("mt-0.5", v.className) }),
              /* @__PURE__ */ jsxs6("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx7("div", { className: cn("text-sm font-medium", tk.fg), children: item.title }),
                item.description !== void 0 && /* @__PURE__ */ jsx7("div", { className: cn("mt-0.5 text-sm", tk.fgMuted), children: item.description })
              ] }),
              /* @__PURE__ */ jsx7(
                "button",
                {
                  type: "button",
                  "aria-label": "Dismiss notification",
                  onClick: () => dismissToast(item.id),
                  className: cn("shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100", tk.fgMuted, focusRing),
                  children: /* @__PURE__ */ jsx7(Icon, { name: "x", size: 16 })
                }
              )
            ]
          },
          item.id
        );
      })
    }
  );
}

// src/components/app-shell.tsx
import { Fragment as Fragment2, jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var STORAGE_KEY2 = "rm-sidebar";
function readCollapsed(fallback) {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY2);
    if (v === "collapsed") return true;
    if (v === "expanded") return false;
  } catch {
  }
  return fallback;
}
function isActive(item, activePath) {
  if (!activePath) return false;
  if (item.exact ?? item.path === "/") return item.path === activePath;
  return activePath === item.path || activePath.startsWith(item.path.replace(/\/$/, "") + "/");
}
var CONTENT_WIDTH = {
  default: "max-w-6xl",
  wide: "max-w-7xl",
  full: "max-w-none"
};
function AppShell({
  title,
  subtitle,
  accent,
  logo,
  nav,
  activePath,
  onNavigate,
  connectionState,
  headerRight,
  topbar,
  layout: layoutProp,
  collapsible = true,
  defaultCollapsed = false,
  sidebarFooter,
  contentWidth = "default",
  children,
  className,
  style,
  ...props
}) {
  useThemeBridge();
  useLayoutEffect3(() => {
    ensureTokens();
    applyAccent(accent);
  }, [accent]);
  const items2 = nav ?? [];
  const layout = layoutProp ?? (items2.length >= 2 ? "sidebar" : "topbar");
  const [collapsed, setCollapsed] = useState5(() => collapsible ? readCollapsed(defaultCollapsed) : false);
  const [menuOpen, setMenuOpen] = useState5(false);
  const embedded = typeof window !== "undefined" && window.parent !== window;
  const toggleCollapsed = useCallback2(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(STORAGE_KEY2, next ? "collapsed" : "expanded");
      } catch {
      }
      return next;
    });
  }, []);
  useEffect6(() => {
    setMenuOpen(false);
  }, [activePath]);
  const ctx = useMemo(
    () => ({ onNavigate, activePath, layout, collapsed: layout === "sidebar" && collapsed }),
    [onNavigate, activePath, layout, collapsed]
  );
  const brand = /* @__PURE__ */ jsxs7("div", { className: "flex min-w-0 items-center gap-2.5", children: [
    logo ?? /* @__PURE__ */ jsx8(
      "span",
      {
        "aria-hidden": "true",
        className: cn("flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold", tk.radiusMd, tk.bgPrimary, tk.fgOnPrimary),
        children: firstGlyph(title)
      }
    ),
    !(layout === "sidebar" && collapsed) && /* @__PURE__ */ jsxs7("span", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx8("span", { className: cn("block truncate text-sm font-semibold", tk.fg), children: title }),
      subtitle !== void 0 && /* @__PURE__ */ jsx8("span", { className: cn("block truncate text-xs", tk.fgMuted), children: subtitle })
    ] })
  ] });
  const footer = sidebarFooter ?? (embedded ? null : /* @__PURE__ */ jsx8(ThemeToggle, { showLabel: !collapsed }));
  return /* @__PURE__ */ jsx8(ShellContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs7(
    "div",
    {
      "data-rm-shell": layout,
      className: cn("flex min-h-screen text-left antialiased", tk.bgBackground, tk.fg, layout === "sidebar" ? "flex-row" : "flex-col", className),
      style,
      ...props,
      children: [
        layout === "sidebar" && /* @__PURE__ */ jsxs7(
          "aside",
          {
            "aria-label": "Sidebar",
            "data-rm-collapsed": collapsed || void 0,
            className: cn(
              "sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-[width] duration-200 md:flex",
              tk.bgSidebar,
              tk.borderSidebar,
              tk.fgSidebar,
              collapsed ? "w-14" : "w-60"
            ),
            children: [
              /* @__PURE__ */ jsx8("div", { className: cn("flex h-14 items-center border-b px-3", tk.borderSidebar), children: brand }),
              /* @__PURE__ */ jsx8(NavList, { items: items2, activePath, onNavigate, collapsed }),
              /* @__PURE__ */ jsxs7("div", { className: cn("mt-auto flex items-center gap-1 border-t p-2", tk.borderSidebar, collapsed ? "flex-col" : "flex-row justify-between"), children: [
                footer,
                collapsible && /* @__PURE__ */ jsx8(
                  "button",
                  {
                    type: "button",
                    "aria-label": collapsed ? "Expand the sidebar" : "Collapse the sidebar",
                    "aria-expanded": !collapsed,
                    onClick: toggleCollapsed,
                    className: cn("p-1.5", ghostControl, focusRing),
                    children: /* @__PURE__ */ jsx8(Icon, { name: collapsed ? "panel-left" : "panel-left-close", size: 16 })
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs7("div", { className: "flex min-w-0 flex-1 flex-col", children: [
          /* @__PURE__ */ jsx8("header", { className: cn("sticky top-0 z-30 border-b backdrop-blur", tk.border, "bg-[color:oklch(var(--rm-card)/0.85)]"), children: /* @__PURE__ */ jsxs7(
            "div",
            {
              className: cn(
                "flex h-14 w-full items-center gap-3 px-4 md:px-6",
                layout === "topbar" && cn("mx-auto", CONTENT_WIDTH[contentWidth])
              ),
              children: [
                layout === "sidebar" && /* @__PURE__ */ jsx8(
                  "button",
                  {
                    type: "button",
                    "aria-label": "Open the menu",
                    "aria-expanded": menuOpen,
                    onClick: () => setMenuOpen(true),
                    className: cn("-ml-1 p-1.5 md:hidden", ghostControl, focusRing),
                    children: /* @__PURE__ */ jsx8(Icon, { name: "menu", size: 20 })
                  }
                ),
                /* @__PURE__ */ jsx8("div", { className: cn("min-w-0", layout === "sidebar" && "md:hidden"), children: brand }),
                layout === "topbar" && items2.length > 0 && /* @__PURE__ */ jsx8("nav", { "aria-label": "Main", className: "hidden items-center gap-1 overflow-x-auto md:flex", children: items2.map((item) => /* @__PURE__ */ jsx8(TopNavItem, { item, active: isActive(item, activePath), onNavigate }, item.path)) }),
                topbar !== void 0 && /* @__PURE__ */ jsx8("div", { className: "min-w-0 flex-1 md:px-4", children: topbar }),
                /* @__PURE__ */ jsxs7("div", { className: "ml-auto flex items-center gap-2", children: [
                  headerRight,
                  layout === "topbar" && items2.length > 0 && /* @__PURE__ */ jsx8(
                    "button",
                    {
                      type: "button",
                      "aria-label": "Open the menu",
                      "aria-expanded": menuOpen,
                      onClick: () => setMenuOpen(true),
                      className: cn("p-1.5 md:hidden", ghostControl, focusRing),
                      children: /* @__PURE__ */ jsx8(Icon, { name: "menu", size: 20 })
                    }
                  )
                ] })
              ]
            }
          ) }),
          /* @__PURE__ */ jsx8(ConnectionBanner, { state: connectionState }),
          /* @__PURE__ */ jsx8("main", { className: cn("mx-auto w-full flex-1 px-4 py-6 md:px-6", CONTENT_WIDTH[contentWidth]), children })
        ] }),
        items2.length > 0 && /* @__PURE__ */ jsx8(Drawer, { open: menuOpen, onClose: () => setMenuOpen(false), side: "left", size: "sm", title, children: /* @__PURE__ */ jsx8(NavList, { items: items2, activePath, onNavigate, collapsed: false, className: "-mx-2" }) }),
        /* @__PURE__ */ jsx8(Toast, {})
      ]
    }
  ) });
}
function NavList({
  items: items2,
  activePath,
  onNavigate,
  collapsed,
  className
}) {
  const seen = /* @__PURE__ */ new Set();
  return /* @__PURE__ */ jsx8("nav", { "aria-label": "Main", className: cn("flex flex-1 flex-col gap-0.5 overflow-y-auto p-2", className), children: items2.map((item) => {
    const heading = item.group && !seen.has(item.group) ? item.group : null;
    if (item.group) seen.add(item.group);
    return /* @__PURE__ */ jsxs7("div", { className: "contents", children: [
      heading && !collapsed && /* @__PURE__ */ jsx8("div", { className: cn("mb-1 mt-3 px-2 text-[11px] font-medium uppercase tracking-wide first:mt-1", tk.fgMuted), children: heading }),
      heading && collapsed && /* @__PURE__ */ jsx8("div", { role: "separator", className: cn("my-1 h-px", tk.bgBorder) }),
      /* @__PURE__ */ jsx8(SideNavItem, { item, active: isActive(item, activePath), onNavigate, collapsed })
    ] }, item.path);
  }) });
}
function SideNavItem({
  item,
  active,
  onNavigate,
  collapsed
}) {
  const classes = cn(
    "flex w-full items-center gap-2.5 px-2 py-1.5 text-left text-sm font-medium transition-colors",
    tk.radiusMd,
    focusRing,
    collapsed && "justify-center px-0",
    active ? cn(tk.bgSidebarAccent, tk.fg) : cn(tk.fgSidebar, tk.hoverBgSidebarAccent, tk.hoverFg)
  );
  const inner = /* @__PURE__ */ jsxs7(Fragment2, { children: [
    /* @__PURE__ */ jsx8("span", { className: cn("shrink-0", active ? tk.fgPrimary : tk.fgMuted), children: renderIcon(item.icon ?? "circle-dot", 18) }),
    !collapsed && /* @__PURE__ */ jsx8("span", { className: "min-w-0 flex-1 truncate", children: item.label }),
    !collapsed && item.badge !== void 0 && /* @__PURE__ */ jsx8("span", { className: cn("rounded-full px-1.5 text-[11px] font-medium tabular-nums", tk.bgMuted, tk.fgMuted), children: item.badge })
  ] });
  const common = {
    "aria-current": active ? "page" : void 0,
    title: collapsed ? item.label : void 0,
    className: classes
  };
  return onNavigate ? /* @__PURE__ */ jsx8("button", { type: "button", onClick: () => onNavigate(item.path), ...common, children: inner }) : /* @__PURE__ */ jsx8("a", { href: item.path, ...common, children: inner });
}
function TopNavItem({
  item,
  active,
  onNavigate
}) {
  const classes = cn(
    "inline-flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors",
    tk.radiusMd,
    focusRing,
    active ? cn(tk.bgMuted, tk.fg) : cn(tk.fgMuted, tk.hoverBgMutedHalf, tk.hoverFg)
  );
  const inner = /* @__PURE__ */ jsxs7(Fragment2, { children: [
    item.icon !== void 0 && /* @__PURE__ */ jsx8("span", { className: cn("shrink-0", active ? tk.fgPrimary : tk.fgMuted), children: renderIcon(item.icon, 16) }),
    item.label,
    item.badge !== void 0 && /* @__PURE__ */ jsx8("span", { className: cn("rounded-full px-1.5 text-[11px] font-medium tabular-nums", tk.bgMuted, tk.fgMuted), children: item.badge })
  ] });
  return onNavigate ? /* @__PURE__ */ jsx8("button", { type: "button", onClick: () => onNavigate(item.path), "aria-current": active ? "page" : void 0, className: classes, children: inner }) : /* @__PURE__ */ jsx8("a", { href: item.path, "aria-current": active ? "page" : void 0, className: classes, children: inner });
}
function firstGlyph(title) {
  if (typeof title === "string" && title.length > 0) return title[0].toUpperCase();
  return "R";
}

// src/components/screen.tsx
import { useId as useId3 } from "react";

// src/components/page-header.tsx
import { useContext as useContext2 } from "react";

// src/components/breadcrumbs.tsx
import { Fragment as Fragment3, useContext } from "react";
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
function Breadcrumbs({
  items: items2,
  onNavigate,
  label = "Breadcrumb",
  className,
  ...props
}) {
  const shell = useContext(ShellContext);
  const go = onNavigate ?? shell?.onNavigate;
  return /* @__PURE__ */ jsx9("nav", { "aria-label": label, className: cn("text-left text-sm", className), ...props, children: /* @__PURE__ */ jsx9("ol", { className: cn("flex flex-wrap items-center gap-1", tk.fgMuted), children: items2.map((item, i) => {
    const last = i === items2.length - 1;
    const linkClasses = cn("rounded px-0.5 transition-colors", tk.hoverFg, focusRing);
    return /* @__PURE__ */ jsxs8(Fragment3, { children: [
      /* @__PURE__ */ jsx9("li", { className: "min-w-0", children: last || !item.path ? /* @__PURE__ */ jsx9("span", { "aria-current": last ? "page" : void 0, className: cn("truncate", last && cn("font-medium", tk.fg)), children: item.label }) : go ? /* @__PURE__ */ jsx9("button", { type: "button", onClick: () => go(item.path), className: linkClasses, children: item.label }) : /* @__PURE__ */ jsx9("a", { href: item.path, className: linkClasses, children: item.label }) }),
      !last && /* @__PURE__ */ jsx9("li", { "aria-hidden": "true", className: cn("select-none", tk.fgFaint), children: /* @__PURE__ */ jsx9(Icon, { name: "chevron-right", size: 14 }) })
    ] }, i);
  }) }) });
}

// src/components/page-header.tsx
import { jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
function PageHeader({
  title,
  description,
  icon,
  badge,
  breadcrumbs,
  backPath,
  onNavigate,
  actions,
  tabs,
  titleId,
  className,
  ...props
}) {
  const shell = useContext2(ShellContext);
  const go = onNavigate ?? shell?.onNavigate;
  return /* @__PURE__ */ jsxs9("header", { className: cn("mb-6 text-left", className), ...props, children: [
    breadcrumbs && breadcrumbs.length > 0 && /* @__PURE__ */ jsx10(Breadcrumbs, { items: breadcrumbs, onNavigate: go, className: "mb-2" }),
    /* @__PURE__ */ jsxs9("div", { className: "flex flex-wrap items-start justify-between gap-x-4 gap-y-3", children: [
      /* @__PURE__ */ jsxs9("div", { className: "flex min-w-0 items-start gap-3", children: [
        backPath !== void 0 && /* @__PURE__ */ jsx10(
          "button",
          {
            type: "button",
            "aria-label": "Back",
            onClick: () => go ? go(backPath) : window.location.href = backPath,
            className: cn("mt-0.5 p-1", ghostControl, focusRing),
            children: /* @__PURE__ */ jsx10(Icon, { name: "arrow-left", size: 18 })
          }
        ),
        icon !== void 0 && /* @__PURE__ */ jsx10(
          "span",
          {
            "aria-hidden": "true",
            className: cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center", tk.radiusMd, tk.bgPrimarySoft, tk.fgPrimary),
            children: renderIcon(icon, 20)
          }
        ),
        /* @__PURE__ */ jsxs9("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs9("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx10("h1", { id: titleId, className: textStyles.pageTitle, children: title }),
            badge
          ] }),
          description !== void 0 && /* @__PURE__ */ jsx10("p", { className: cn("mt-1", textStyles.muted), children: description })
        ] })
      ] }),
      actions !== void 0 && /* @__PURE__ */ jsx10("div", { className: "flex flex-wrap items-center gap-2", children: actions })
    ] }),
    tabs !== void 0 && /* @__PURE__ */ jsx10("div", { className: "mt-4", children: tabs })
  ] });
}

// src/components/screen.tsx
import { jsx as jsx11, jsxs as jsxs10 } from "react/jsx-runtime";
function Screen({
  title,
  description,
  actions,
  icon,
  badge,
  breadcrumbs,
  backPath,
  tabs,
  children,
  className,
  ...props
}) {
  const headingId = useId3();
  return /* @__PURE__ */ jsxs10("section", { "aria-labelledby": headingId, className: cn("text-left", className), "data-rm-screen": "", ...props, children: [
    /* @__PURE__ */ jsx11(
      PageHeader,
      {
        titleId: headingId,
        title,
        description,
        actions,
        icon,
        badge,
        breadcrumbs,
        backPath,
        tabs
      }
    ),
    children
  ] });
}

// src/components/badge.tsx
import { jsx as jsx12, jsxs as jsxs11 } from "react/jsx-runtime";
var VARIANTS = {
  neutral: { pill: cn(tk.bgMuted, tk.fg, "ring-transparent"), dot: tk.bgForeground },
  accent: { pill: cn(tk.bgPrimarySoft, tk.fgPrimary, "ring-transparent"), dot: tk.bgPrimary },
  success: { pill: cn(tk.bgSuccessSoft, tk.fgSuccess, "ring-transparent"), dot: tk.bgSuccess },
  warning: { pill: cn(tk.bgWarningSoft, tk.fgWarning, "ring-transparent"), dot: tk.bgWarning },
  danger: { pill: cn(tk.bgDestructiveSoft, tk.fgDestructive, "ring-transparent"), dot: tk.bgDestructive },
  info: { pill: cn(tk.bgInfoSoft, tk.fgInfo, "ring-transparent"), dot: tk.bgInfo },
  outline: { pill: cn("bg-transparent", tk.fg, tk.ringBorder), dot: tk.bgForeground }
};
function badgeDotClass(variant) {
  return VARIANTS[variant].dot;
}
function Badge({
  variant = "neutral",
  size: size3 = "md",
  dot = false,
  icon,
  onRemove,
  removeLabel = "Remove",
  className,
  children,
  ...props
}) {
  const v = VARIANTS[variant];
  return /* @__PURE__ */ jsxs11(
    "span",
    {
      className: cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full font-medium ring-1 ring-inset",
        size3 === "sm" ? "px-1.5 py-0 text-[11px] leading-5" : "px-2 py-0.5 text-xs",
        v.pill,
        className
      ),
      ...props,
      children: [
        dot && /* @__PURE__ */ jsx12("span", { "aria-hidden": "true", className: cn("h-1.5 w-1.5 shrink-0 rounded-full", v.dot) }),
        renderIcon(icon, 12),
        /* @__PURE__ */ jsx12("span", { className: "truncate", children }),
        onRemove && /* @__PURE__ */ jsx12(
          "button",
          {
            type: "button",
            "aria-label": removeLabel,
            onClick: onRemove,
            className: cn("-mr-1 ml-0.5 rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100", focusRing),
            children: /* @__PURE__ */ jsx12(Icon, { name: "x", size: 12 })
          }
        )
      ]
    }
  );
}

// src/components/kbd.tsx
import { jsx as jsx13 } from "react/jsx-runtime";
function Kbd({ className, children, ...props }) {
  return /* @__PURE__ */ jsx13(
    "kbd",
    {
      className: cn(
        "inline-flex h-5 min-w-5 items-center justify-center border px-1 font-mono text-[11px] font-medium",
        tk.radiusSm,
        tk.border,
        tk.bgMuted,
        tk.fgMuted,
        className
      ),
      ...props,
      children
    }
  );
}

// src/components/separator.tsx
import { jsx as jsx14, jsxs as jsxs12 } from "react/jsx-runtime";
function Separator({ orientation = "horizontal", label, className, ...props }) {
  if (orientation === "vertical") {
    return /* @__PURE__ */ jsx14("div", { role: "separator", "aria-orientation": "vertical", className: cn("h-5 w-px self-center", tk.bgBorder, className), ...props });
  }
  if (label === void 0) {
    return /* @__PURE__ */ jsx14("div", { role: "separator", className: cn("h-px w-full", tk.bgBorder, className), ...props });
  }
  return /* @__PURE__ */ jsxs12("div", { role: "separator", className: cn("flex items-center gap-3", className), ...props, children: [
    /* @__PURE__ */ jsx14("span", { "aria-hidden": "true", className: cn("h-px flex-1", tk.bgBorder) }),
    /* @__PURE__ */ jsx14("span", { className: cn("shrink-0 text-xs", tk.fgMuted), children: label }),
    /* @__PURE__ */ jsx14("span", { "aria-hidden": "true", className: cn("h-px flex-1", tk.bgBorder) })
  ] });
}

// src/components/description-list.tsx
import { jsx as jsx15, jsxs as jsxs13 } from "react/jsx-runtime";
var COLUMNS = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3"
};
function isEmpty(v) {
  return v === void 0 || v === null || v === "" || v === false;
}
function DescriptionList({
  items: items2,
  columns = 1,
  inline: inline2 = false,
  dense = false,
  emptyText = "\u2013",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx15("dl", { className: cn("grid grid-cols-1 text-left", dense ? "gap-2" : "gap-4", COLUMNS[columns], className), ...props, children: items2.map((item, i) => /* @__PURE__ */ jsxs13(
    "div",
    {
      className: cn(
        inline2 ? "grid grid-cols-[minmax(6rem,_auto)_1fr] items-baseline gap-x-4" : "flex flex-col gap-0.5",
        item.wide && "md:col-span-full"
      ),
      children: [
        /* @__PURE__ */ jsx15("dt", { className: cn("text-xs font-medium", tk.fgMuted), children: item.label }),
        /* @__PURE__ */ jsx15("dd", { className: cn("min-w-0 break-words text-sm", isEmpty(item.value) ? tk.fgFaint : tk.fg), children: isEmpty(item.value) ? emptyText : item.value })
      ]
    },
    i
  )) });
}

// src/components/toolbar.tsx
import { forwardRef as forwardRef3, useId as useId4 } from "react";
import { jsx as jsx16, jsxs as jsxs14 } from "react/jsx-runtime";
function Toolbar({ end, children, className, ...props }) {
  return /* @__PURE__ */ jsxs14(
    "div",
    {
      role: "toolbar",
      className: cn("flex flex-wrap items-center gap-2", className),
      ...props,
      children: [
        /* @__PURE__ */ jsx16("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-2", children }),
        end !== void 0 && /* @__PURE__ */ jsx16("div", { className: "flex shrink-0 items-center gap-2", children: end })
      ]
    }
  );
}
var SearchInput = forwardRef3(function SearchInput2({ value, onChange, label = "Search", clearable = true, placeholder = "Search", className, id, ...props }, ref) {
  const ownId = useId4();
  const inputId = id ?? ownId;
  return /* @__PURE__ */ jsxs14("div", { className: cn("relative w-full max-w-xs", className), children: [
    /* @__PURE__ */ jsx16(
      Icon,
      {
        name: "search",
        size: 16,
        className: cn("pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2", tk.fgMuted)
      }
    ),
    /* @__PURE__ */ jsx16(
      "input",
      {
        ref,
        id: inputId,
        type: "search",
        role: "searchbox",
        "aria-label": label,
        value,
        onChange: (e) => onChange?.(e.target.value),
        placeholder,
        className: cn(inputBase, "h-9 pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"),
        ...props
      }
    ),
    clearable && value && /* @__PURE__ */ jsx16(
      "button",
      {
        type: "button",
        "aria-label": "Clear the search",
        onClick: () => onChange?.(""),
        className: cn("absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5", tk.fgMuted, tk.hoverFg, focusRing),
        children: /* @__PURE__ */ jsx16(Icon, { name: "x", size: 14 })
      }
    )
  ] });
});

// src/components/pagination.tsx
import { jsx as jsx17, jsxs as jsxs15 } from "react/jsx-runtime";
function Pagination({
  page,
  pageCount,
  onChange,
  total,
  pageSize,
  label = "Pagination",
  noun = "rows",
  size: size3 = "sm",
  className,
  ...props
}) {
  const count = Math.max(1, pageCount);
  const current = Math.min(Math.max(1, page), count);
  const range = total !== void 0 && pageSize !== void 0 && pageSize > 0 ? total === 0 ? `0 ${noun}` : `${(current - 1) * pageSize + 1} to ${Math.min(total, current * pageSize)} of ${total.toLocaleString()} ${noun}` : null;
  return /* @__PURE__ */ jsxs15("nav", { "aria-label": label, className: cn("flex flex-wrap items-center justify-between gap-2", className), ...props, children: [
    /* @__PURE__ */ jsx17("div", { className: cn("text-xs tabular-nums", tk.fgMuted), children: range ?? `Page ${current} of ${count}` }),
    /* @__PURE__ */ jsxs15("div", { className: "flex items-center gap-1", children: [
      range && /* @__PURE__ */ jsxs15("span", { className: cn("mr-1 text-xs tabular-nums", tk.fgMuted), children: [
        "Page ",
        current,
        " of ",
        count
      ] }),
      /* @__PURE__ */ jsx17(
        Button,
        {
          size: size3,
          variant: "outline",
          icon: "chevron-left",
          onClick: () => onChange(current - 1),
          disabled: current <= 1,
          "aria-label": "Previous page",
          children: "Previous"
        }
      ),
      /* @__PURE__ */ jsx17(
        Button,
        {
          size: size3,
          variant: "outline",
          iconRight: "chevron-right",
          onClick: () => onChange(current + 1),
          disabled: current >= count,
          "aria-label": "Next page",
          children: "Next"
        }
      )
    ] })
  ] });
}

// src/components/segmented-control.tsx
import { jsx as jsx18, jsxs as jsxs16 } from "react/jsx-runtime";
function SegmentedControl({ options, value, onChange, label, size: size3 = "md", className, ...props }) {
  return /* @__PURE__ */ jsx18(
    "div",
    {
      role: "group",
      "aria-label": label,
      className: cn("inline-flex items-center gap-0.5 p-0.5", tk.radiusMd, tk.bgMuted, className),
      ...props,
      children: options.map((o) => {
        const active = o.value === value;
        return /* @__PURE__ */ jsxs16(
          "button",
          {
            type: "button",
            "aria-pressed": active,
            disabled: o.disabled,
            onClick: () => onChange(o.value),
            className: cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              tk.radiusSm,
              size3 === "sm" ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm",
              active ? cn(tk.bgCard, tk.fg, tk.shadowSm) : cn(tk.fgMuted, tk.hoverFg),
              focusRing
            ),
            children: [
              renderIcon(o.icon, size3 === "sm" ? 14 : 16),
              o.label
            ]
          },
          o.value
        );
      })
    }
  );
}

// src/components/sparkline.tsx
import { useId as useId6 } from "react";

// src/components/chart.tsx
import { useId as useId5, useMemo as useMemo2, useState as useState7 } from "react";

// src/measure.ts
import { useEffect as useEffect7, useRef as useRef3, useState as useState6 } from "react";
function useMeasure(fallback = { width: 0, height: 0 }) {
  const ref = useRef3(null);
  const [size3, setSize] = useState6(fallback);
  useEffect7(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) {
        setSize((s) => s.width === r.width && s.height === r.height ? s : { width: r.width, height: r.height });
      }
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, ...size3, measured: size3.width > 0 || size3.height > 0 };
}

// src/source.ts
import { lookupTag, splitLinkKey as splitLinkKey2 } from "@robomotion/apps-runtime";
function isActionSource(source) {
  return "action" in source && !!source.action;
}
function readPageReply(reply, req) {
  if (Array.isArray(reply)) {
    return { rows: reply, total: reply.length };
  }
  const obj = reply ?? {};
  const rowsValue = obj.rows ?? obj.items ?? obj.records ?? obj.data;
  const rows = Array.isArray(rowsValue) ? rowsValue : [];
  const totalValue = obj.total ?? obj.count ?? obj.totalCount ?? obj.total_count;
  if (typeof totalValue === "number" && Number.isFinite(totalValue)) {
    return { rows, total: totalValue };
  }
  const seen = req.offset + rows.length;
  const maybeMore = req.limit > 0 && rows.length >= req.limit;
  return { rows, total: maybeMore ? seen + 1 : seen };
}
function sourceLinkAttrs(source) {
  const name = isActionSource(source) ? source.action.name : source.name;
  return name ? { "data-rm-action": name } : {};
}
function rowsLinkAttrs(rows) {
  if (!rows || rows.length === 0) {
    const bare = rows ? lookupTag(rows) : void 0;
    if (!bare) return {};
    const { ns: ns2, name: name2 } = splitLinkKey2(bare.key);
    return { [`data-rm-${ns2}`]: name2 };
  }
  const tag = lookupTag(rows) ?? lookupTag(rows[0]);
  if (!tag) return {};
  const { ns, name } = splitLinkKey2(tag.key);
  return { [`data-rm-${ns}`]: name };
}

// src/components/chart.tsx
import { Fragment as Fragment4, jsx as jsx19, jsxs as jsxs17 } from "react/jsx-runtime";
var FALLBACK_WIDTH = 480;
var PALETTE = 5;
function paletteColor(i) {
  return `oklch(var(--rm-chart-${i % PALETTE + 1}))`;
}
function seriesColor(i, n, own) {
  if (own) return { color: own, opacity: 1 };
  if (n <= 1) return { color: paletteColor(0), opacity: 1 };
  const lap = Math.floor(i / PALETTE);
  return { color: paletteColor(i), opacity: Math.max(0.4, 1 - lap * 0.3) };
}
function seriesOpacity(i, n, floor2 = 0.3) {
  if (n <= 1) return 1;
  const step = (1 - floor2) / Math.max(1, n - 1);
  return Number((1 - i * step).toFixed(3));
}
function sparklinePath(values, width, height) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return "";
  const max2 = Math.max(...clean);
  const min2 = Math.min(...clean);
  const span = max2 - min2 || 1;
  const x = (i) => clean.length === 1 ? width / 2 : i * width / (clean.length - 1);
  const y = (v) => height - (v - min2) / span * height;
  return clean.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
}
function asTime(x) {
  if (typeof x === "number") return Number.isFinite(x) ? x : null;
  const ms = Date.parse(x);
  return Number.isNaN(ms) ? null : ms;
}
function buildPlot(data, series, xKind, fallbackName) {
  const list = series && series.length > 0 ? series : data && data.length > 0 ? [{ name: fallbackName, points: data.map((d) => ({ x: d.label, y: d.value })) }] : [];
  const categories = [];
  for (const s of list) {
    for (const p of s.points) {
      if (!categories.some((c) => String(c) === String(p.x))) categories.push(p.x);
    }
  }
  const parsed = categories.map(asTime);
  const isTime = xKind === "time" || xKind === void 0 && categories.length > 0 && parsed.every((t) => t !== null);
  if (isTime) {
    const order2 = categories.map((c, i) => i).sort((a, b) => (parsed[a] ?? 0) - (parsed[b] ?? 0));
    const sortedCats = order2.map((i) => categories[i]);
    const sortedTimes = order2.map((i) => parsed[i] ?? 0);
    categories.length = 0;
    categories.push(...sortedCats);
    return { series: list, categories, times: sortedTimes, grid: gridOf(list, categories) };
  }
  return { series: list, categories, times: null, grid: gridOf(list, categories) };
}
function gridOf(list, categories) {
  return list.map((s) => {
    const byX = /* @__PURE__ */ new Map();
    for (const p of s.points) if (Number.isFinite(p.y)) byX.set(String(p.x), p.y);
    return categories.map((c) => byX.get(String(c)));
  });
}
function Chart({
  kind,
  data,
  series,
  xKind,
  legend,
  stacked = false,
  title,
  description,
  height = 220,
  formatValue,
  formatX,
  emptyState,
  source,
  className
}) {
  const id = useId5();
  const fmt = formatValue ?? ((v) => v.toLocaleString());
  const linkAttrs = source ? sourceLinkAttrs(source) : {};
  const plot = useMemo2(
    () => buildPlot(data, series, xKind, title ?? "Value"),
    [data, series, xKind, title]
  );
  const [hover, setHover] = useState7(null);
  const { ref, width: measured } = useMeasure({ width: FALLBACK_WIDTH, height: 0 });
  const width = measured > 0 ? measured : FALLBACK_WIDTH;
  const n = plot.series.length;
  const round3 = kind === "pie" || kind === "donut";
  const showLegend = legend ?? (round3 || n > 1);
  const fmtX = useMemo2(() => {
    if (formatX) return formatX;
    if (!plot.times) return (x) => String(x);
    return (x) => {
      const t = asTime(x);
      if (t === null) return String(x);
      const iso2 = typeof x === "string" ? x : "";
      const opts = /^\d{4}-\d{2}$/.test(iso2) ? { year: "2-digit", month: "short" } : { month: "short", day: "numeric" };
      return new Date(t).toLocaleDateString(void 0, opts);
    };
  }, [formatX, plot.times]);
  const empty = plot.categories.length === 0 || plot.series.every((s) => s.points.length === 0);
  if (empty) {
    return /* @__PURE__ */ jsx19(
      "div",
      {
        className: cn("border border-dashed px-6 py-10 text-center text-sm", tk.radius, tk.borderInput, tk.fgMuted, className),
        ...linkAttrs,
        children: emptyState ?? "Nothing to chart yet."
      }
    );
  }
  const desc = description ?? describe(kind, plot, fmt, fmtX);
  const geo = geometry(plot, kind, stacked, width, height, n > 1);
  const viewW = round3 ? height : width;
  return /* @__PURE__ */ jsx19("div", { ref, className: cn("text-left", tk.fg, className), ...linkAttrs, children: /* @__PURE__ */ jsxs17("div", { className: round3 ? "flex flex-wrap items-center gap-6" : "relative", children: [
    /* @__PURE__ */ jsxs17(
      "svg",
      {
        role: "img",
        "aria-labelledby": `${id}-t ${id}-d`,
        viewBox: `0 0 ${viewW} ${height}`,
        className: cn("h-auto", round3 ? "w-48 max-w-full" : "w-full"),
        onMouseLeave: () => setHover(null),
        children: [
          /* @__PURE__ */ jsx19("title", { id: `${id}-t`, children: title ?? "Chart" }),
          /* @__PURE__ */ jsx19("desc", { id: `${id}-d`, children: desc }),
          round3 ? /* @__PURE__ */ jsx19(Pie, { plot, size: height, donut: kind === "donut", fmt }) : /* @__PURE__ */ jsxs17(Fragment4, { children: [
            /* @__PURE__ */ jsx19(Axes, { geo, plot, width, height, fmt, fmtX }),
            kind === "bar" ? /* @__PURE__ */ jsx19(Bars, { plot, geo, width, fmt, stacked }) : /* @__PURE__ */ jsx19(Lines, { plot, geo, kind, fmt }),
            /* @__PURE__ */ jsx19(HoverBands, { geo, height, count: plot.categories.length, onHover: setHover })
          ] })
        ]
      }
    ),
    !round3 && hover !== null && /* @__PURE__ */ jsx19(Tooltip, { plot, at: hover, geo, width, fmt, fmtX }),
    showLegend && /* @__PURE__ */ jsx19(Legend, { plot, round: round3, fmt, className: round3 ? "min-w-0 flex-1" : "mt-2" })
  ] }) });
}
var PAD = { top: 14, right: 8, bottom: 26 };
var PAD_LEFT_BARE = 8;
var PAD_LEFT_AXIS = 38;
function geometry(plot, kind, stacked, width, height, showAxis) {
  const padLeft = showAxis ? PAD_LEFT_AXIS : PAD_LEFT_BARE;
  const plotW = Math.max(1, width - padLeft - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const count = plot.categories.length;
  const values = [];
  if (kind === "bar" && stacked) {
    for (let i = 0; i < count; i++) {
      let sum = 0;
      for (const row of plot.grid) sum += row[i] ?? 0;
      values.push(sum);
    }
  } else {
    for (const row of plot.grid) for (const v of row) if (v !== void 0) values.push(v);
  }
  const max2 = Math.max(...values, 0);
  const min2 = Math.min(...values, 0);
  const span = max2 - min2 || 1;
  const y = (v) => PAD.top + plotH - (v - min2) / span * plotH;
  const slot = count > 0 ? plotW / count : plotW;
  const slotX = (i) => padLeft + (i + 0.5) * slot;
  const times = plot.times;
  const tMin = times ? Math.min(...times) : 0;
  const tSpan = times ? Math.max(...times) - tMin || 1 : 1;
  const pointX = times && count > 1 ? (i) => padLeft + (times[i] - tMin) / tSpan * plotW : (i) => count === 1 ? padLeft + plotW / 2 : padLeft + i * plotW / (count - 1);
  const ticks = showAxis ? [min2, min2 + span / 2, max2] : [];
  return { padLeft, plotW, plotH, min: min2, max: max2, y, slotX, pointX, slot, ticks, showAxis };
}
var AXIS_STROKE = "oklch(var(--rm-border))";
var axisText = cn("fill-current", tk.fgMuted);
function Axes({
  geo,
  plot,
  width,
  height,
  fmt,
  fmtX
}) {
  const count = plot.categories.length;
  const every = Math.max(1, Math.ceil(count / 6));
  return /* @__PURE__ */ jsxs17(Fragment4, { children: [
    geo.ticks.map((t, i) => /* @__PURE__ */ jsxs17("g", { children: [
      /* @__PURE__ */ jsx19(
        "line",
        {
          x1: geo.padLeft,
          y1: geo.y(t),
          x2: width - PAD.right,
          y2: geo.y(t),
          stroke: AXIS_STROKE,
          strokeWidth: 1
        }
      ),
      /* @__PURE__ */ jsx19("text", { x: geo.padLeft - 6, y: geo.y(t) + 3, textAnchor: "end", fontSize: 9, className: axisText, children: fmt(t) })
    ] }, `tick-${i}`)),
    !geo.showAxis && /* @__PURE__ */ jsx19(
      "line",
      {
        x1: geo.padLeft,
        y1: geo.y(Math.max(0, geo.min)),
        x2: width - PAD.right,
        y2: geo.y(Math.max(0, geo.min)),
        stroke: AXIS_STROKE,
        strokeWidth: 1
      }
    ),
    plot.categories.map(
      (c, i) => i % every === 0 ? /* @__PURE__ */ jsx19(
        "text",
        {
          x: geo.slotX(i),
          y: height - 8,
          textAnchor: "middle",
          fontSize: 10,
          className: axisText,
          children: clip(fmtX(c), Math.max(4, Math.floor(geo.slot * every / 6)))
        },
        `x-${i}`
      ) : null
    )
  ] });
}
function Bars({
  plot,
  geo,
  width,
  fmt,
  stacked
}) {
  const n = plot.series.length;
  const base2 = geo.y(Math.max(0, geo.min));
  const groupW = Math.max(4, Math.min(48 * (stacked || n === 1 ? 1 : n), geo.slot * 0.7));
  const barW = stacked || n === 1 ? groupW : groupW / n;
  return /* @__PURE__ */ jsxs17(Fragment4, { children: [
    plot.categories.map((c, i) => {
      const cx2 = geo.slotX(i);
      let stackTop = base2;
      return /* @__PURE__ */ jsxs17("g", { children: [
        plot.series.map((s, si) => {
          const v = plot.grid[si][i];
          if (v === void 0) return null;
          const top = geo.y(v);
          const paint = seriesColor(si, n, s.color);
          if (stacked) {
            const h = Math.abs(base2 - top);
            const yTop = stackTop - h;
            stackTop = yTop;
            return /* @__PURE__ */ jsx19(
              "rect",
              {
                "data-rm-series": si,
                x: cx2 - groupW / 2,
                y: yTop,
                width: groupW,
                height: Math.max(h, v === 0 ? 0 : 1),
                rx: 2,
                fill: paint.color,
                fillOpacity: paint.opacity
              },
              si
            );
          }
          const x = n === 1 ? cx2 - barW / 2 : cx2 - groupW / 2 + si * barW;
          return /* @__PURE__ */ jsx19(
            "rect",
            {
              "data-rm-series": si,
              x,
              y: Math.min(top, base2),
              width: Math.max(2, barW - (n > 1 ? 1 : 0)),
              height: Math.max(Math.abs(base2 - top), v === 0 ? 0 : 1),
              rx: 2,
              fill: paint.color,
              fillOpacity: s.color ? 1 : n === 1 ? seriesOpacity(i, plot.categories.length) : paint.opacity
            },
            si
          );
        }),
        n === 1 && plot.grid[0][i] !== void 0 && /* @__PURE__ */ jsx19(
          "text",
          {
            x: cx2,
            y: Math.min(geo.y(plot.grid[0][i]), base2) - 4,
            textAnchor: "middle",
            fontSize: 10,
            className: axisText,
            children: fmt(plot.grid[0][i])
          }
        )
      ] }, `g-${i}`);
    }),
    /* @__PURE__ */ jsx19("line", { x1: geo.padLeft, y1: base2, x2: width - PAD.right, y2: base2, stroke: AXIS_STROKE, strokeWidth: 1 })
  ] });
}
function Lines({
  plot,
  geo,
  kind,
  fmt
}) {
  const n = plot.series.length;
  return /* @__PURE__ */ jsx19(Fragment4, { children: plot.series.map((s, si) => {
    const pts = [];
    plot.grid[si].forEach((v, i) => {
      if (v !== void 0) pts.push({ x: geo.pointX(i), y: geo.y(v), v });
    });
    if (pts.length === 0) return null;
    const paint = seriesColor(si, n, s.color);
    const stroke = paint.color;
    const opacity = paint.opacity;
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
    const floor2 = geo.y(geo.min);
    return /* @__PURE__ */ jsxs17("g", { "data-rm-series": si, children: [
      kind === "area" && /* @__PURE__ */ jsx19(
        "path",
        {
          d: `${line} L ${pts[pts.length - 1].x},${floor2} L ${pts[0].x},${floor2} Z`,
          fill: stroke,
          fillOpacity: 0.12 * opacity + 0.04
        }
      ),
      /* @__PURE__ */ jsx19(
        "path",
        {
          d: line,
          fill: "none",
          stroke,
          strokeOpacity: opacity,
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      ),
      pts.map((p, i) => /* @__PURE__ */ jsx19("circle", { cx: p.x, cy: p.y, r: 2.5, fill: stroke, fillOpacity: opacity }, i)),
      n === 1 && pts.map(
        (p, i) => i % Math.max(1, Math.ceil(pts.length / 6)) === 0 ? /* @__PURE__ */ jsx19("text", { x: p.x, y: p.y - 7, textAnchor: "middle", fontSize: 10, className: axisText, children: fmt(p.v) }, `v-${i}`) : null
      )
    ] }, si);
  }) });
}
function sliceColor(i) {
  const lap = Math.floor(i / PALETTE);
  return { color: paletteColor(i), opacity: Math.max(0.35, 1 - lap * 0.25) };
}
function Pie({ plot, size: size3, donut, fmt }) {
  const row = plot.grid[0] ?? [];
  const values = plot.categories.map((_, i) => Math.max(0, row[i] ?? 0));
  const total = values.reduce((a, b) => a + b, 0);
  const r = Math.max(10, size3 / 2 - 8);
  const ri = donut ? r * 0.62 : 0;
  const cx2 = size3 / 2;
  const cy = size3 / 2;
  const middle = donut ? /* @__PURE__ */ jsx19(
    "text",
    {
      x: cx2,
      y: cy,
      textAnchor: "middle",
      dominantBaseline: "central",
      fontSize: Math.max(14, Math.round(r * 0.28)),
      fontWeight: 600,
      className: cn("fill-current tabular-nums", tk.fg),
      children: fmt(total)
    }
  ) : null;
  if (total <= 0) {
    return /* @__PURE__ */ jsxs17(Fragment4, { children: [
      donut ? /* @__PURE__ */ jsx19("circle", { cx: cx2, cy, r: (r + ri) / 2, fill: "none", stroke: paletteColor(0), strokeOpacity: 0.15, strokeWidth: r - ri }) : /* @__PURE__ */ jsx19("circle", { cx: cx2, cy, r, fill: paletteColor(0), fillOpacity: 0.15 }),
      middle
    ] });
  }
  let angle = -Math.PI / 2;
  return /* @__PURE__ */ jsxs17(Fragment4, { children: [
    values.map((v, i) => {
      const share = v / total;
      const start = angle;
      angle += share * Math.PI * 2;
      const paint = sliceColor(i);
      if (share >= 0.9999) {
        return donut ? /* @__PURE__ */ jsx19(
          "path",
          {
            d: `M ${cx2 - r},${cy} A ${r},${r} 0 1 0 ${cx2 + r},${cy} A ${r},${r} 0 1 0 ${cx2 - r},${cy} Z M ${cx2 - ri},${cy} A ${ri},${ri} 0 1 1 ${cx2 + ri},${cy} A ${ri},${ri} 0 1 1 ${cx2 - ri},${cy} Z`,
            fillRule: "evenodd",
            fill: paint.color,
            fillOpacity: paint.opacity
          },
          i
        ) : /* @__PURE__ */ jsx19("circle", { cx: cx2, cy, r, fill: paint.color, fillOpacity: paint.opacity }, i);
      }
      if (share <= 0) return null;
      const x1 = cx2 + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx2 + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      const large = share * Math.PI * 2 > Math.PI ? 1 : 0;
      const d = donut ? `M ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} L ${cx2 + ri * Math.cos(angle)},${cy + ri * Math.sin(angle)} A ${ri},${ri} 0 ${large} 0 ${cx2 + ri * Math.cos(start)},${cy + ri * Math.sin(start)} Z` : `M ${cx2},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
      return /* @__PURE__ */ jsx19("path", { d, fill: paint.color, fillOpacity: paint.opacity }, i);
    }),
    middle
  ] });
}
function HoverBands({
  geo,
  height,
  count,
  onHover
}) {
  return /* @__PURE__ */ jsx19(Fragment4, { children: Array.from({ length: count }, (_, i) => /* @__PURE__ */ jsx19(
    "rect",
    {
      x: geo.padLeft + i * geo.slot,
      y: PAD.top,
      width: geo.slot,
      height: height - PAD.top - PAD.bottom,
      fill: "transparent",
      onMouseEnter: () => onHover(i),
      onFocus: () => onHover(i)
    },
    i
  )) });
}
function Tooltip({
  plot,
  at,
  geo,
  width,
  fmt,
  fmtX
}) {
  const rows = plot.series.map((s, si) => ({ name: s.name, color: s.color, i: si, v: plot.grid[si][at] })).filter((r) => r.v !== void 0);
  if (rows.length === 0) return null;
  const left = geo.slotX(at) / width * 100;
  return /* @__PURE__ */ jsxs17(
    "div",
    {
      role: "presentation",
      style: { left: `${left}%` },
      className: cn("pointer-events-none absolute top-1 z-10 -translate-x-1/2 px-2 py-1.5 text-xs", panelBase),
      children: [
        /* @__PURE__ */ jsx19("div", { className: cn("font-medium", tk.fg), children: fmtX(plot.categories[at]) }),
        rows.map((r) => {
          const paint = seriesColor(r.i, plot.series.length, r.color);
          return /* @__PURE__ */ jsxs17("div", { className: "mt-0.5 flex items-center gap-1.5 whitespace-nowrap", children: [
            /* @__PURE__ */ jsx19(
              "span",
              {
                "aria-hidden": "true",
                className: "h-2 w-2 shrink-0 rounded-sm",
                style: { background: paint.color, opacity: paint.opacity }
              }
            ),
            /* @__PURE__ */ jsx19("span", { className: tk.fgMuted, children: r.name }),
            /* @__PURE__ */ jsx19("span", { className: cn("ml-auto tabular-nums", tk.fg), children: fmt(r.v) })
          ] }, r.i);
        })
      ]
    }
  );
}
function Legend({
  plot,
  round: round3,
  fmt,
  className
}) {
  const entries = round3 ? plot.categories.map((c, i) => {
    const paint = sliceColor(i);
    return {
      key: `${String(c)}-${i}`,
      label: String(c),
      value: plot.grid[0]?.[i],
      color: paint.color,
      opacity: paint.opacity
    };
  }) : plot.series.map((s, i) => {
    const paint = seriesColor(i, plot.series.length, s.color);
    return { key: `${s.name}-${i}`, label: s.name, value: void 0, color: paint.color, opacity: paint.opacity };
  });
  return /* @__PURE__ */ jsx19("ul", { className: cn("space-y-1 text-sm", className), children: entries.map((e) => /* @__PURE__ */ jsxs17("li", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx19(
      "span",
      {
        "aria-hidden": "true",
        className: "h-3 w-3 shrink-0 rounded-sm",
        style: { background: e.color, opacity: e.opacity }
      }
    ),
    /* @__PURE__ */ jsx19("span", { className: cn("min-w-0 flex-1 truncate", tk.fg), children: e.label }),
    e.value !== void 0 && /* @__PURE__ */ jsx19("span", { className: cn("tabular-nums", tk.fgMuted), children: fmt(e.value) })
  ] }, e.key)) });
}
function describe(kind, plot, fmt, fmtX) {
  if (plot.series.length > 1) {
    const names = plot.series.map((s) => s.name).join(", ");
    const first = fmtX(plot.categories[0]);
    const last = fmtX(plot.categories[plot.categories.length - 1]);
    return `${kind} chart, ${plot.series.length} series (${names}) across ${plot.categories.length} points from ${first} to ${last}`;
  }
  const row = plot.grid[0] ?? [];
  const n = plot.categories.length;
  return `${kind} chart, ${n} ${n === 1 ? "value" : "values"}: ` + plot.categories.slice(0, 8).map((c, i) => `${fmtX(c)} ${row[i] === void 0 ? "no value" : fmt(row[i])}`).join(", ") + (n > 8 ? ", and more" : "");
}
function clip(text, max2) {
  if (max2 <= 1 || text.length <= max2) return text;
  return `${text.slice(0, Math.max(1, max2 - 1))}\u2026`;
}

// src/components/sparkline.tsx
import { Fragment as Fragment5, jsx as jsx20, jsxs as jsxs18 } from "react/jsx-runtime";
function Sparkline({ values, width = 120, height = 28, area = true, color, label, className }) {
  const id = useId6();
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) return null;
  const pad = 2;
  const line = sparklinePath(clean, width, height - pad * 2);
  const stroke = color ?? "oklch(var(--rm-primary))";
  return /* @__PURE__ */ jsxs18(
    "svg",
    {
      "aria-hidden": label ? void 0 : "true",
      role: label ? "img" : void 0,
      "aria-label": label,
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "none",
      className: cn("block h-7 w-full", className),
      "data-rm-sparkline": "",
      children: [
        area && /* @__PURE__ */ jsxs18(Fragment5, { children: [
          /* @__PURE__ */ jsx20("defs", { children: /* @__PURE__ */ jsxs18("linearGradient", { id: `${id}-g`, x1: "0", x2: "0", y1: "0", y2: "1", children: [
            /* @__PURE__ */ jsx20("stop", { offset: "0", stopColor: stroke, stopOpacity: "0.25" }),
            /* @__PURE__ */ jsx20("stop", { offset: "1", stopColor: stroke, stopOpacity: "0" })
          ] }) }),
          /* @__PURE__ */ jsx20(
            "path",
            {
              d: `${line} L ${width},${height} L 0,${height} Z`,
              transform: `translate(0 ${pad})`,
              fill: `url(#${id}-g)`
            }
          )
        ] }),
        /* @__PURE__ */ jsx20(
          "path",
          {
            d: line,
            transform: `translate(0 ${pad})`,
            fill: "none",
            stroke,
            strokeWidth: 1.5,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            vectorEffect: "non-scaling-stroke"
          }
        )
      ]
    }
  );
}

// src/components/alert.tsx
import { jsx as jsx21, jsxs as jsxs19 } from "react/jsx-runtime";
var VARIANTS2 = {
  info: { box: cn(tk.borderInfoSoft, tk.bgInfoSoft, tk.fg), icon: tk.fgInfo, glyph: "info", label: "Information" },
  success: {
    box: cn(tk.borderSuccessSoft, tk.bgSuccessSoft, tk.fg),
    icon: tk.fgSuccess,
    glyph: "circle-check",
    label: "Success"
  },
  warning: {
    box: cn(tk.borderWarningSoft, tk.bgWarningSoft, tk.fg),
    icon: tk.fgWarning,
    glyph: "triangle-alert",
    label: "Warning"
  },
  error: {
    box: cn(tk.borderDestructiveSoft, tk.bgDestructiveSoft, tk.fg),
    icon: tk.fgDestructive,
    glyph: "circle-alert",
    label: "Error"
  }
};
function Alert({
  variant = "info",
  title,
  onDismiss,
  action,
  children,
  className,
  ...props
}) {
  const v = VARIANTS2[variant];
  return /* @__PURE__ */ jsxs19(
    "div",
    {
      role: variant === "error" || variant === "warning" ? "alert" : "status",
      className: cn("flex items-start gap-3 border p-3 text-left text-sm", tk.radius, v.box, className),
      ...props,
      children: [
        /* @__PURE__ */ jsx21(Icon, { name: v.glyph, size: 16, className: cn("mt-0.5", v.icon) }),
        /* @__PURE__ */ jsxs19("div", { className: "min-w-0 flex-1", children: [
          title !== void 0 && /* @__PURE__ */ jsx21("div", { className: "font-medium", children: title }),
          children !== void 0 && /* @__PURE__ */ jsx21("div", { className: cn(title !== void 0 && "mt-0.5", tk.fgMuted), children }),
          action !== void 0 && /* @__PURE__ */ jsx21("div", { className: "mt-2", children: action })
        ] }),
        onDismiss && /* @__PURE__ */ jsx21(CloseButton, { onClick: onDismiss, label: `Dismiss this ${v.label.toLowerCase()}` })
      ]
    }
  );
}

// src/components/copy-button.tsx
import { useState as useState8 } from "react";
import { jsx as jsx22, jsxs as jsxs20 } from "react/jsx-runtime";
function CopyButton({
  value,
  children,
  label = "Copy",
  toastTitle = "Copied",
  size: size3 = "sm",
  disabled,
  className
}) {
  const [copied, setCopied] = useState8(false);
  const copy = async () => {
    const ok = await writeClipboard(value);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 1600);
    if (toastTitle !== void 0) {
      toast(
        ok ? { title: toastTitle, variant: "success", durationMs: 2e3 } : { title: "Could not copy", description: "Select the text and copy it by hand.", variant: "error" }
      );
    }
  };
  return /* @__PURE__ */ jsxs20(
    "button",
    {
      type: "button",
      "aria-label": children === void 0 ? label : void 0,
      disabled,
      onClick: () => void copy(),
      className: cn(
        "inline-flex items-center gap-1.5 border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        tk.radiusMd,
        tk.borderInput,
        tk.bgCard,
        tk.fg,
        tk.shadowSm,
        tk.hoverBgMutedHalf,
        size3 === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
        focusRing,
        className
      ),
      children: [
        copied ? /* @__PURE__ */ jsx22(Icon, { name: "check", size: 14, strokeWidth: 2.5, className: tk.fgSuccess }) : /* @__PURE__ */ jsx22(Icon, { name: "copy", size: 14, className: tk.fgMuted }),
        children
      ]
    }
  );
}
async function writeClipboard(text) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
  }
  if (typeof document === "undefined") return false;
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

// src/components/menu.tsx
import {
  Children,
  createContext as createContext2,
  forwardRef as forwardRef4,
  useContext as useContext3,
  useEffect as useEffect9,
  useRef as useRef5,
  useState as useState10
} from "react";

// src/floating.ts
import { useCallback as useCallback3, useEffect as useEffect8, useRef as useRef4, useState as useState9 } from "react";

// node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var min = Math.min;
var max = Math.max;
var round2 = Math.round;
var floor = Math.floor;
var createCoords = (v) => ({
  x: v,
  y: v
});
var oppositeSideMap = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function clamp(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
  return placement.split("-")[0];
}
function getAlignment(placement) {
  return placement.split("-")[1];
}
function getOppositeAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
  return axis === "y" ? "height" : "width";
}
function getSideAxis(placement) {
  const firstChar = placement[0];
  return firstChar === "t" || firstChar === "b" ? "y" : "x";
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.includes("start") ? placement.replace("start", "end") : placement.replace("end", "start");
}
var lrPlacement = ["left", "right"];
var rlPlacement = ["right", "left"];
var tbPlacement = ["top", "bottom"];
var btPlacement = ["bottom", "top"];
function getSideList(side, isStart, rtl) {
  switch (side) {
    case "top":
    case "bottom":
      if (rtl) return isStart ? rlPlacement : lrPlacement;
      return isStart ? lrPlacement : rlPlacement;
    case "left":
    case "right":
      return isStart ? tbPlacement : btPlacement;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === "start", rtl);
  if (alignment) {
    list = list.map((side) => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
function getOppositePlacement(placement) {
  const side = getSide(placement);
  return oppositeSideMap[side] + placement.slice(side.length);
}
function expandPaddingObject(padding) {
  var _padding$top, _padding$right, _padding$bottom, _padding$left;
  return {
    top: (_padding$top = padding.top) != null ? _padding$top : 0,
    right: (_padding$right = padding.right) != null ? _padding$right : 0,
    bottom: (_padding$bottom = padding.bottom) != null ? _padding$bottom : 0,
    left: (_padding$left = padding.left) != null ? _padding$left : 0
  };
}
function getPaddingObject(padding) {
  return typeof padding !== "number" ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const {
    x,
    y,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y
  };
}

// node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === "y";
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case "top":
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case "bottom":
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case "right":
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case "left":
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  const alignment = getAlignment(placement);
  if (alignment) {
    coords[alignmentAxis] += commonAlign * (alignment === "end" ? 1 : -1) * (rtl && isVertical ? -1 : 1);
  }
  return coords;
}
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x,
    y,
    platform: platform2,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = "clippingAncestors",
    rootBoundary = "viewport",
    elementContext = "floating",
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === "floating" ? "reference" : "floating";
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform2.getClippingRect({
    element: ((_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === "floating" ? {
    x,
    y,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating));
  const offsetScale = await (platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) && await (platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}
var MAX_RESET_COUNT = 50;
var computePosition = async (reference, floating, config) => {
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform: platform2
  } = config;
  const platformWithDetectOverflow = platform2.detectOverflow ? platform2 : {
    ...platform2,
    detectOverflow
  };
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating));
  let rects = await platform2.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let resetCount = 0;
  const middlewareData = {};
  for (let i = 0; i < middleware.length; i++) {
    const currentMiddleware = middleware[i];
    if (!currentMiddleware) {
      continue;
    }
    const {
      name,
      fn
    } = currentMiddleware;
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform: platformWithDetectOverflow,
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData[name] = {
      ...middlewareData[name],
      ...data
    };
    if (reset && resetCount < MAX_RESET_COUNT) {
      resetCount++;
      if (typeof reset === "object") {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform2.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};
var flip = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "flip",
    options,
    async fn(state) {
      var _middlewareData$arrow, _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform: platform2,
        elements
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = "bestFit",
        fallbackAxisSideDirection = "none",
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state);
      if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      const side = getSide(placement);
      const initialSideAxis = getSideAxis(initialPlacement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
      if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements2 = [initialPlacement, ...fallbackPlacements];
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides2 = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides2[0]], overflow[sides2[1]]);
      }
      overflowsData = [...overflowsData, {
        placement,
        overflows
      }];
      if (!overflows.every((side2) => side2 <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements2[nextIndex];
        if (nextPlacement) {
          const ignoreCrossAxisOverflow = checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false;
          if (!ignoreCrossAxisOverflow || // We leave the current main axis only if every placement on that axis
          // overflows the main axis.
          overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) {
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }
        }
        let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case "bestFit": {
              var _overflowsData$filter2;
              const placement2 = (_overflowsData$filter2 = overflowsData.filter((d) => {
                if (hasFallbackAxisSideDirection) {
                  const currentSideAxis = getSideAxis(d.placement);
                  return currentSideAxis === initialSideAxis || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  currentSideAxis === "y";
                }
                return true;
              }).map((d) => [d.placement, d.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
              if (placement2) {
                resetPlacement = placement2;
              }
              break;
            }
            case "initialPlacement":
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
};
var originSides = /* @__PURE__ */ new Set(["left", "top"]);
async function convertValueToCoords(state, options) {
  const {
    placement,
    platform: platform2,
    elements
  } = state;
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === "y";
  const mainAxisMulti = originSides.has(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === "number" ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: rawValue.mainAxis || 0,
    crossAxis: rawValue.crossAxis || 0,
    alignmentAxis: rawValue.alignmentAxis
  };
  if (alignment && typeof alignmentAxis === "number") {
    crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}
var offset = function(options) {
  if (options === void 0) {
    options = 0;
  }
  return {
    name: "offset",
    options,
    async fn(state) {
      var _middlewareData$offse, _middlewareData$arrow;
      const {
        x,
        y,
        placement,
        middlewareData
      } = state;
      const diffCoords = await convertValueToCoords(state, options);
      if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: {
          ...diffCoords,
          placement
        }
      };
    }
  };
};
var shift = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "shift",
    options,
    async fn(state) {
      const {
        x,
        y,
        placement,
        platform: platform2
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: (_ref) => {
            let {
              x: x2,
              y: y2
            } = _ref;
            return {
              x: x2,
              y: y2
            };
          }
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const coords = {
        x,
        y
      };
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const crossAxis = getSideAxis(placement);
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      const clampCoord = (axis, coord) => clamp(coord + overflow[axis === "y" ? "top" : "left"], coord, coord - overflow[axis === "y" ? "bottom" : "right"]);
      if (checkMainAxis) {
        mainAxisCoord = clampCoord(mainAxis, mainAxisCoord);
      }
      if (checkCrossAxis) {
        crossAxisCoord = clampCoord(crossAxis, crossAxisCoord);
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y,
          enabled: {
            [mainAxis]: checkMainAxis,
            [crossAxis]: checkCrossAxis
          }
        }
      };
    }
  };
};
var size = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "size",
    options,
    async fn(state) {
      const {
        placement,
        rects,
        platform: platform2,
        elements
      } = state;
      const {
        apply = () => {
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const side = getSide(placement);
      const alignment = getAlignment(placement);
      const isYAxis = getSideAxis(placement) === "y";
      const {
        width,
        height
      } = rects.floating;
      let heightSide;
      let widthSide;
      if (side === "top" || side === "bottom") {
        heightSide = side;
        widthSide = alignment === (await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
      } else {
        widthSide = side;
        heightSide = alignment === "end" ? "top" : "bottom";
      }
      const maximumClippingHeight = height - overflow.top - overflow.bottom;
      const maximumClippingWidth = width - overflow.left - overflow.right;
      const overflowAvailableHeight = min(height - overflow[heightSide], maximumClippingHeight);
      const overflowAvailableWidth = min(width - overflow[widthSide], maximumClippingWidth);
      const shiftData = state.middlewareData.shift;
      const noShift = !shiftData;
      let availableHeight = overflowAvailableHeight;
      let availableWidth = overflowAvailableWidth;
      if (shiftData != null && shiftData.enabled.x) {
        availableWidth = maximumClippingWidth;
      }
      if (shiftData != null && shiftData.enabled.y) {
        availableHeight = maximumClippingHeight;
      }
      if (noShift && !alignment) {
        if (isYAxis) {
          availableWidth = width - 2 * max(overflow.left, overflow.right);
        } else {
          availableHeight = height - 2 * max(overflow.top, overflow.bottom);
        }
      }
      await apply({
        ...state,
        availableWidth,
        availableHeight
      });
      const nextDimensions = await platform2.getDimensions(elements.floating);
      if (width !== nextDimensions.width || height !== nextDimensions.height) {
        return {
          reset: {
            rects: true
          }
        };
      }
      return {};
    }
  };
};

// node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function hasWindow() {
  return typeof window !== "undefined";
}
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || "").toLowerCase();
  }
  return "#document";
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === "undefined") {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle2(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && display !== "inline" && display !== "contents";
}
function isTableElement(element) {
  return /^(table|td|th)$/.test(getNodeName(element));
}
function isTopLayer(element) {
  try {
    if (element.matches(":popover-open")) {
      return true;
    }
  } catch (_e) {
  }
  try {
    return element.matches(":modal");
  } catch (_e) {
    return false;
  }
}
var willChangeRe = /transform|translate|scale|rotate|perspective|filter/;
var containRe = /paint|layout|strict|content/;
var isNotNone = (value) => !!value && value !== "none";
var isWebKitValue;
function isContainingBlock(elementOrCss) {
  const css = isElement(elementOrCss) ? getComputedStyle2(elementOrCss) : elementOrCss;
  return isNotNone(css.transform) || isNotNone(css.translate) || isNotNone(css.scale) || isNotNone(css.rotate) || isNotNone(css.perspective) || !isWebKit() && (isNotNone(css.backdropFilter) || isNotNone(css.filter)) || willChangeRe.test(css.willChange || "") || containRe.test(css.contain || "");
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (isWebKitValue == null) {
    isWebKitValue = typeof CSS !== "undefined" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none");
  }
  return isWebKitValue;
}
function isLastTraversableNode(node) {
  return /^(html|body|#document)$/.test(getNodeName(node));
}
function getComputedStyle2(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = (
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    isShadowRoot(node) && node.host || // Fallback.
    getDocumentElement(node)
  );
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return (node.ownerDocument || node).body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    const frameElement = getFrameElement(win);
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
  } else {
    return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
  }
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}

// node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
  const css = getComputedStyle2(element);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round2(width) !== offsetWidth || round2(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}
function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}
function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $
  } = getCssDimensions(domElement);
  let x = ($ ? round2(rect.width) : rect.width) / width;
  let y = ($ ? round2(rect.height) : rect.height) / height;
  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}
var noOffsets = /* @__PURE__ */ createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  return !!floatingOffsetParent && isFixed && floatingOffsetParent === getWindow(element);
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement && offsetParent) {
    const win = getWindow(domElement);
    const offsetWin = isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle2(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}
function getWindowScrollBarX(element, rect) {
  const leftScroll = getNodeScroll(element).scrollLeft;
  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
  }
  return rect.left + leftScroll;
}
function getHTMLOffset(documentElement, scroll) {
  const htmlRect = documentElement.getBoundingClientRect();
  const x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
  const y = htmlRect.top + scroll.scrollTop;
  return {
    x,
    y
  };
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === "fixed";
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  if (isOffsetParentAnElement || !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
  };
}
function getClientRects(element) {
  return element.getClientRects ? Array.from(element.getClientRects()) : [];
}
function getDocumentRect(html) {
  const scroll = getNodeScroll(html);
  const body = html.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(html);
  const y = -scroll.scrollTop;
  if (getComputedStyle2(body).direction === "rtl") {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}
var SCROLLBAR_MAX = 25;
function getViewportRect(element, strategy, rootBoundary) {
  if (rootBoundary === void 0) {
    rootBoundary = "viewport";
  }
  const isLayoutViewport = rootBoundary === "layoutViewport";
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    const layoutRelativeClientCoords = !isWebKit() || strategy === "fixed";
    if (isLayoutViewport) {
      if (!layoutRelativeClientCoords) {
        x = -visualViewport.offsetLeft;
        y = -visualViewport.offsetTop;
      }
    } else {
      width = visualViewport.width;
      height = visualViewport.height;
      if (layoutRelativeClientCoords) {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
  }
  const windowScrollbarX = getWindowScrollBarX(html);
  if (windowScrollbarX <= 0) {
    const doc = html.ownerDocument;
    const body = doc.body;
    const bodyStyles = getComputedStyle(body);
    const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
    const reservedWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
    const gutter = getComputedStyle(html).scrollbarGutter === "stable both-edges" ? reservedWidth / 2 : reservedWidth;
    if (gutter <= SCROLLBAR_MAX) {
      width -= gutter;
    }
  }
  return {
    width,
    height,
    x,
    y
  };
}
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = getScale(element);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === "viewport" || clippingAncestor === "layoutViewport") {
    rect = getViewportRect(element, strategy, clippingAncestor);
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height
    };
  }
  return rectToClientRect(rect);
}
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
  let lastKeptComputedStyle = null;
  const elementIsFixed = getComputedStyle2(element).position === "fixed";
  let currentNode = elementIsFixed ? getParentNode(element) : element;
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle2(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    const lastPosition = lastKeptComputedStyle ? lastKeptComputedStyle.position : elementIsFixed ? "fixed" : "";
    const shouldDropCurrentNode = !currentNodeIsContaining && (lastPosition === "fixed" || lastPosition === "absolute" && computedStyle.position === "static");
    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode);
    } else {
      lastKeptComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstRect = getClientRectFromClippingAncestor(element, clippingAncestors[0], strategy);
  let top = firstRect.top;
  let right = firstRect.right;
  let bottom = firstRect.bottom;
  let left = firstRect.left;
  for (let i = 1; i < clippingAncestors.length; i++) {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestors[i], strategy);
    top = max(rect.top, top);
    right = min(rect.right, right);
    bottom = min(rect.bottom, bottom);
    left = max(rect.left, left);
  }
  return {
    width: right - left,
    height: bottom - top,
    x: left,
    y: top
  };
}
function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === "fixed";
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  if (isOffsetParentAnElement || !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  if (!isOffsetParentAnElement && documentElement) {
    offsets.x = getWindowScrollBarX(documentElement);
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
  const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
  return {
    x,
    y,
    width: rect.width,
    height: rect.height
  };
}
function isStaticPositioned(element) {
  return getComputedStyle2(element).position === "static";
}
function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle2(element).position === "fixed") {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  let rawOffsetParent = element.offsetParent;
  if (getDocumentElement(element) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body;
  }
  return rawOffsetParent;
}
function getOffsetParent(element, polyfill) {
  const win = getWindow(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}
var getElementRects = async function(data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data.floating);
  return {
    reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height
    }
  };
};
function isRTL(element) {
  return getComputedStyle2(element).direction === "rtl";
}
var platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};
function rectsAreEqual(a, b) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
function observeMove(element, onMove, ancestorResize) {
  let io = null;
  let timeoutId;
  const root = getDocumentElement(element);
  function cleanup() {
    var _io;
    clearTimeout(timeoutId);
    (_io = io) == null || _io.disconnect();
    io = null;
  }
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false;
    }
    if (threshold === void 0) {
      threshold = 1;
    }
    cleanup();
    const elementRectForRootMargin = element.getBoundingClientRect();
    const {
      left,
      top,
      width,
      height
    } = elementRectForRootMargin;
    if (!skip) {
      onMove();
    }
    if (!width || !height) {
      return;
    }
    const insetTop = floor(top);
    const insetRight = floor(root.clientWidth - (left + width));
    const insetBottom = floor(root.clientHeight - (top + height));
    const insetLeft = floor(left);
    const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1
    };
    let isFirstUpdate = true;
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio;
      if (!rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())) {
        return refresh();
      }
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }
        if (!ratio) {
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7);
          }, 1e3);
        } else {
          refresh(false, ratio);
        }
      }
      isFirstUpdate = false;
    }
    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument
      });
    } catch (_e) {
      io = new IntersectionObserver(handleObserve, options);
    }
    io.observe(element);
  }
  const win = getWindow(element);
  const handleResize = () => refresh(ancestorResize);
  win.addEventListener("resize", handleResize);
  refresh(true);
  return () => {
    win.removeEventListener("resize", handleResize);
    cleanup();
  };
}
function autoUpdate(reference, floating, update, options) {
  if (options === void 0) {
    options = {};
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === "function",
    layoutShift = typeof IntersectionObserver === "function",
    animationFrame = false
  } = options;
  const referenceEl = unwrapElement(reference);
  const ancestors = ancestorScroll || ancestorResize ? [...referenceEl ? getOverflowAncestors(referenceEl) : [], ...floating ? getOverflowAncestors(floating) : []] : [];
  ancestors.forEach((ancestor) => {
    ancestorScroll && ancestor.addEventListener("scroll", update);
    ancestorResize && ancestor.addEventListener("resize", update);
  });
  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update, ancestorResize) : null;
  let reobserveFrame = -1;
  let resizeObserver = null;
  if (elementResize) {
    resizeObserver = new ResizeObserver((_ref) => {
      let [firstEntry] = _ref;
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver && floating) {
        resizeObserver.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          var _resizeObserver;
          (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
        });
      }
      update();
    });
    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl);
    }
    if (floating) {
      resizeObserver.observe(floating);
    }
  }
  let frameId;
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
  if (animationFrame) {
    frameLoop();
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect(reference);
    if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) {
      update();
    }
    prevRefRect = nextRefRect;
    frameId = requestAnimationFrame(frameLoop);
  }
  update();
  return () => {
    var _resizeObserver2;
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.removeEventListener("scroll", update);
      ancestorResize && ancestor.removeEventListener("resize", update);
    });
    cleanupIo == null || cleanupIo();
    (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
    resizeObserver = null;
    if (animationFrame) {
      cancelAnimationFrame(frameId);
    }
  };
}
var offset2 = offset;
var shift2 = shift;
var flip2 = flip;
var size2 = size;
var computePosition2 = (reference, floating, options) => {
  const cache = /* @__PURE__ */ new Map();
  const mergedOptions = options != null ? options : {};
  const platformWithCache = {
    ...platform,
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};

// src/floating.ts
function toPlacement(side, align) {
  return align === "center" ? side : `${side}-${align}`;
}
function useFloating({
  open,
  side = "bottom",
  align = "start",
  gap = 6,
  matchWidth = false,
  fitHeight = true
}) {
  const reference = useRef4(null);
  const [floating, setFloatingEl] = useState9(null);
  const [pos, setPos] = useState9({
    x: 0,
    y: 0,
    placement: toPlacement(side, align)
  });
  const setReference = useCallback3((el) => {
    if (el) reference.current = el;
  }, []);
  const setFloating = useCallback3((el) => {
    if (el) setFloatingEl(el);
  }, []);
  useEffect8(() => {
    const ref = reference.current;
    const fl = floating;
    if (!open || !ref || !fl || !fl.isConnected) return;
    let cancelled = false;
    const update = async () => {
      try {
        const middleware = [offset2(gap), flip2(), shift2({ padding: 8 })];
        if (matchWidth || fitHeight) {
          middleware.push(
            size2({
              padding: 8,
              apply({ rects, availableHeight, elements }) {
                if (matchWidth) elements.floating.style.width = `${rects.reference.width}px`;
                if (fitHeight) elements.floating.style.maxHeight = `${Math.max(120, availableHeight)}px`;
              }
            })
          );
        }
        const r = await computePosition2(ref, fl, {
          placement: toPlacement(side, align),
          strategy: "fixed",
          middleware
        });
        if (cancelled) return;
        setPos({
          x: r.x,
          y: r.y,
          placement: r.placement,
          width: matchWidth ? ref.getBoundingClientRect().width : void 0
        });
      } catch {
      }
    };
    const stop = autoUpdate(ref, fl, () => void update());
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, floating, side, align, gap, matchWidth, fitHeight]);
  return {
    refs: { setReference, setFloating },
    style: {
      position: "fixed",
      top: 0,
      left: 0,
      transform: `translate3d(${Math.round(pos.x)}px, ${Math.round(pos.y)}px, 0)`,
      width: pos.width
    },
    placement: pos.placement
  };
}

// src/components/menu.tsx
import { jsx as jsx23, jsxs as jsxs21 } from "react/jsx-runtime";
var MenuContext = createContext2(null);
function Menu({
  items: items2,
  children,
  trigger,
  label = "More",
  align = "end",
  menuLabel = "Actions",
  disabled = false,
  className
}) {
  const [open, setOpen] = useState10(false);
  const buttonRef = useRef5(null);
  const panelRef = useRef5(null);
  const presence = usePresence(open);
  const floating = useFloating({ open, side: "bottom", align, gap: 4 });
  useEffect9(() => {
    if (!open) return;
    const onDocClick = (e) => {
      const target = e.target;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    enabledItems(panelRef.current)[0]?.focus();
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const moveFocus = (delta) => {
    const enabled = enabledItems(panelRef.current);
    if (enabled.length === 0) return;
    const current = enabled.findIndex((el) => el === document.activeElement);
    const next = (current + delta + enabled.length) % enabled.length;
    enabled[next].focus();
  };
  const onMenuKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "Home": {
        e.preventDefault();
        enabledItems(panelRef.current)[0]?.focus();
        break;
      }
      case "End": {
        e.preventDefault();
        const enabled = enabledItems(panelRef.current);
        enabled[enabled.length - 1]?.focus();
        break;
      }
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
    }
  };
  const linkedNames = joinNames((items2 ?? []).map((i) => i.action?.name));
  return /* @__PURE__ */ jsxs21("div", { className: cn("relative inline-block", className), children: [
    /* @__PURE__ */ jsx23(
      "button",
      {
        ref: (el) => {
          buttonRef.current = el;
          floating.refs.setReference(el);
        },
        type: "button",
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-label": label,
        disabled,
        "data-rm-action": linkedNames,
        onClick: () => setOpen((v) => !v),
        onKeyDown: (e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        },
        className: cn("p-1.5", ghostControl, focusRing),
        children: trigger ?? /* @__PURE__ */ jsx23(Icon, { name: "ellipsis-vertical", size: 16 })
      }
    ),
    presence.present && /* @__PURE__ */ jsx23(OverlayPortal, { children: /* @__PURE__ */ jsx23(MenuContext.Provider, { value: { close }, children: /* @__PURE__ */ jsx23(
      "div",
      {
        ref: (el) => {
          panelRef.current = el;
          floating.refs.setFloating(el);
          presence.ref(el);
        },
        role: "menu",
        "aria-label": menuLabel,
        onKeyDown: onMenuKeyDown,
        style: floating.style,
        "data-rm-anim": "popover",
        "data-state": presence.state,
        className: cn("z-50 min-w-44 overflow-hidden py-1 text-left", panelBase),
        children: items2 ? items2.map((item, i) => /* @__PURE__ */ jsx23(
          MenuItem,
          {
            icon: item.icon,
            danger: item.danger,
            disabled: item.disabled,
            action: item.action,
            params: item.params,
            onSelect: item.onSelect,
            children: item.label
          },
          typeof item.label === "string" ? item.label : i
        )) : Children.toArray(children)
      }
    ) }) })
  ] });
}
var MenuItem = forwardRef4(function MenuItem2({ icon, danger, action, params, onSelect, children, className, disabled, onClick, ...props }, ref) {
  const menu = useContext3(MenuContext);
  return /* @__PURE__ */ jsxs21(
    "button",
    {
      ref,
      type: "button",
      role: "menuitem",
      tabIndex: -1,
      disabled,
      "data-rm-action": action?.name,
      onClick: (e) => {
        onClick?.(e);
        menu?.close(false);
        onSelect?.();
        if (action) {
          void runAction(action, resolveParams(params, e)).catch(() => void 0);
        }
      },
      className: cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        danger ? cn(tk.fgDestructive, tk.hoverBgDestructiveSoft, tk.focusBgDestructiveSoft) : cn(tk.fgPopover, tk.hoverBgMuted, tk.focusBgMuted),
        className
      ),
      ...props,
      children: [
        renderIcon(icon, 16, tk.fgMuted),
        /* @__PURE__ */ jsx23("span", { className: "min-w-0 flex-1 truncate", children })
      ]
    }
  );
});
function enabledItems(panel) {
  if (!panel) return [];
  return Array.from(panel.querySelectorAll('[role="menuitem"]')).filter(
    (el) => !el.disabled
  );
}

// src/components/card.tsx
import { jsx as jsx24, jsxs as jsxs22 } from "react/jsx-runtime";
function Card({ className, interactive = false, ...props }) {
  return /* @__PURE__ */ jsx24(
    "div",
    {
      className: cn(
        cardBase,
        "text-left",
        interactive && cn("cursor-pointer transition-shadow", "hover:shadow-[shadow:var(--rm-shadow-md)]"),
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, title, description, icon, actions, children, ...props }) {
  const hasHeading = title !== void 0 || description !== void 0 || icon !== void 0 || actions !== void 0;
  return /* @__PURE__ */ jsxs22("div", { className: cn("border-b px-5 py-4", tk.border, className), ...props, children: [
    hasHeading && /* @__PURE__ */ jsxs22("div", { className: "flex items-start gap-3", children: [
      icon !== void 0 && /* @__PURE__ */ jsx24("span", { "aria-hidden": "true", className: cn("mt-0.5 shrink-0", tk.fgMuted), children: renderIcon(icon, 18) }),
      /* @__PURE__ */ jsxs22("div", { className: "min-w-0 flex-1", children: [
        title !== void 0 && /* @__PURE__ */ jsx24("h3", { className: textStyles.cardTitle, children: title }),
        description !== void 0 && /* @__PURE__ */ jsx24("p", { className: cn("mt-0.5", textStyles.muted), children: description })
      ] }),
      actions !== void 0 && /* @__PURE__ */ jsx24("div", { className: "flex shrink-0 items-center gap-2", children: actions })
    ] }),
    children
  ] });
}
function CardBody({ className, ...props }) {
  return /* @__PURE__ */ jsx24("div", { className: cn("px-5 py-4", className), ...props });
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx24(
    "div",
    {
      className: cn(
        "flex items-center justify-end gap-2 rounded-b-[var(--rm-radius)] border-t px-5 py-3",
        mutedBar,
        className
      ),
      ...props
    }
  );
}

// src/components/tabs.tsx
import {
  Children as Children2,
  createContext as createContext3,
  isValidElement as isValidElement2,
  useContext as useContext4,
  useId as useId7,
  useRef as useRef6,
  useState as useState11
} from "react";
import { jsx as jsx25, jsxs as jsxs23 } from "react/jsx-runtime";
var TabsContext = createContext3(null);
function Tabs({ value, defaultValue: defaultValue2, onChange, label = "Sections", className, children }) {
  const baseId = useId7();
  const listRef = useRef6(null);
  const items2 = Children2.toArray(children);
  const tabs = items2.filter((c) => isValidElement2(c) && c.type === Tab);
  const rest = items2.filter((c) => !(isValidElement2(c) && c.type === Tab));
  const firstValue = (() => {
    const first = tabs[0];
    return isValidElement2(first) ? first.props.value : "";
  })();
  const [ownValue, setOwnValue] = useState11(defaultValue2 ?? firstValue);
  const selected = value ?? ownValue;
  const select = (next) => {
    if (value === void 0) setOwnValue(next);
    onChange?.(next);
  };
  const onKeyDown = (e) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const buttons = Array.from(
      listRef.current?.querySelectorAll('[role="tab"]:not([disabled])') ?? []
    );
    if (buttons.length === 0) return;
    e.preventDefault();
    const current = buttons.findIndex((b) => b === document.activeElement);
    let next = current;
    if (e.key === "ArrowRight") next = (current + 1 + buttons.length) % buttons.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + buttons.length) % buttons.length;
    else if (e.key === "Home") next = 0;
    else next = buttons.length - 1;
    buttons[next]?.focus();
    buttons[next]?.click();
  };
  const ctx = {
    value: selected,
    select,
    tabId: (v) => `${baseId}-tab-${v}`,
    panelId: (v) => `${baseId}-panel-${v}`
  };
  return /* @__PURE__ */ jsx25(TabsContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs23("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx25(
      "div",
      {
        ref: listRef,
        role: "tablist",
        "aria-label": label,
        onKeyDown,
        className: cn("flex items-center gap-1 overflow-x-auto border-b", tk.border),
        children: tabs
      }
    ),
    rest
  ] }) });
}
function Tab({ value, disabled = false, icon, badge, className, children }) {
  const ctx = useContext4(TabsContext);
  const active = ctx?.value === value;
  return /* @__PURE__ */ jsxs23(
    "button",
    {
      type: "button",
      role: "tab",
      id: ctx?.tabId(value),
      "aria-selected": active,
      "aria-controls": ctx?.panelId(value),
      tabIndex: active ? 0 : -1,
      disabled,
      onClick: () => ctx?.select(value),
      className: cn(
        "-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active ? cn(tk.borderPrimary, tk.fg) : cn("border-transparent", tk.fgMuted, "hover:border-[color:oklch(var(--rm-input))]", tk.hoverFg),
        focusRing,
        className
      ),
      children: [
        renderIcon(icon, 16),
        children,
        badge !== void 0 && /* @__PURE__ */ jsx25("span", { className: cn("rounded-full px-1.5 text-xs font-normal tabular-nums", tk.bgMuted, tk.fgMuted), children: badge })
      ]
    }
  );
}
function TabPanel({ value, className, children }) {
  const ctx = useContext4(TabsContext);
  const active = ctx?.value === value;
  if (!active) return null;
  return /* @__PURE__ */ jsx25(
    "div",
    {
      role: "tabpanel",
      id: ctx?.panelId(value),
      "aria-labelledby": ctx?.tabId(value),
      tabIndex: 0,
      className: cn("pt-4 outline-none", className),
      children
    }
  );
}

// src/components/popover.tsx
import { useCallback as useCallback4, useEffect as useEffect10, useId as useId8, useRef as useRef7, useState as useState12 } from "react";
import { Fragment as Fragment6, jsx as jsx26, jsxs as jsxs24 } from "react/jsx-runtime";
function Popover({
  trigger,
  title,
  side = "bottom",
  align = "start",
  open: controlledOpen,
  onOpenChange,
  label,
  width = 288,
  triggerClassName,
  className,
  children
}) {
  const [ownOpen, setOwnOpen] = useState12(false);
  const open = controlledOpen ?? ownOpen;
  const id = useId8();
  const triggerRef = useRef7(null);
  const setOpen = useCallback4(
    (next) => {
      if (controlledOpen === void 0) setOwnOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange]
  );
  const close = useCallback4(() => setOpen(false), [setOpen]);
  const { panelRef, onKeyDown } = useOverlay(open, close);
  const presence = usePresence(open);
  const floating = useFloating({ open, side, align, gap: 8 });
  useEffect10(() => {
    if (!open) return;
    const onDocClick = (e) => {
      const target = e.target;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, close, panelRef]);
  return /* @__PURE__ */ jsxs24(Fragment6, { children: [
    /* @__PURE__ */ jsx26(
      "button",
      {
        ref: (el) => {
          triggerRef.current = el;
          floating.refs.setReference(el);
        },
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": open ? `${id}-panel` : void 0,
        onClick: () => setOpen(!open),
        className: cn(
          "inline-flex h-9 items-center gap-2 border px-3 text-sm font-medium transition-colors",
          tk.radiusMd,
          tk.borderInput,
          tk.bgCard,
          tk.fg,
          tk.shadowSm,
          tk.hoverBgMutedHalf,
          focusRing,
          triggerClassName
        ),
        children: trigger
      }
    ),
    presence.present && /* @__PURE__ */ jsx26(OverlayPortal, { children: /* @__PURE__ */ jsxs24(
      "div",
      {
        ref: (el) => {
          panelRef.current = el;
          floating.refs.setFloating(el);
          presence.ref(el);
        },
        id: `${id}-panel`,
        role: "dialog",
        "aria-label": label ?? (typeof title === "string" ? title : "Options"),
        tabIndex: -1,
        onKeyDown,
        style: { ...floating.style, width },
        "data-rm-anim": "popover",
        "data-state": presence.state,
        className: cn("z-50 max-w-[calc(100vw-1rem)] p-3 text-left text-sm outline-none", panelBase, className),
        children: [
          title !== void 0 && /* @__PURE__ */ jsx26("div", { className: cn("mb-2", textStyles.cardTitle), children: title }),
          children
        ]
      }
    ) })
  ] });
}

// src/components/tooltip.tsx
import {
  Children as Children3,
  cloneElement,
  isValidElement as isValidElement3,
  useId as useId9,
  useState as useState13
} from "react";
import { jsx as jsx27, jsxs as jsxs25 } from "react/jsx-runtime";
function Tooltip2({ content, side = "top", className, children }) {
  const [open, setOpen] = useState13(false);
  const id = useId9();
  const floating = useFloating({ open, side, align: "center", gap: 6, fitHeight: false });
  const child = Children3.only(children);
  const described = isValidElement3(child) ? cloneElement(child, {
    "aria-describedby": open ? id : void 0
  }) : child;
  return /* @__PURE__ */ jsxs25(
    "span",
    {
      ref: floating.refs.setReference,
      className: "relative inline-flex",
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false),
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
      onKeyDown: (e) => {
        if (e.key === "Escape" && open) setOpen(false);
      },
      children: [
        described,
        open && /* @__PURE__ */ jsx27(OverlayPortal, { children: /* @__PURE__ */ jsx27(
          "span",
          {
            ref: floating.refs.setFloating,
            role: "tooltip",
            id,
            style: floating.style,
            "data-rm-anim": "fade",
            "data-state": "open",
            className: cn(
              "pointer-events-none z-50 w-max max-w-xs px-2 py-1 text-xs font-normal",
              tk.radiusSm,
              tk.bgForeground,
              tk.fgBackground,
              tk.shadowMd,
              className
            ),
            children: content
          }
        ) })
      ]
    }
  );
}

// src/components/animated-number.tsx
import { useMemo as useMemo3, useRef as useRef8, useState as useState14 } from "react";
import { Fragment as Fragment7, jsx as jsx28, jsxs as jsxs26 } from "react/jsx-runtime";
function decimalsOf(n) {
  if (!Number.isFinite(n)) return 0;
  const s = String(n);
  const dot = s.indexOf(".");
  return dot < 0 || s.includes("e") ? 0 : Math.min(3, s.length - dot - 1);
}
function AnimatedNumber({ value, durationMs = 600, format, locale, className }) {
  const formatKey = format ? JSON.stringify(format) : "";
  const formatter = useMemo3(() => new Intl.NumberFormat(locale, format), [locale, formatKey]);
  const elRef = useRef8(null);
  const [frame, setFrame] = useState14(null);
  const shown = useRef8(value);
  useIsoLayoutEffect(() => {
    const from = shown.current;
    const to = value;
    if (from === to || durationMs <= 0 || !Number.isFinite(from) || !Number.isFinite(to) || !canAnimate(elRef.current)) {
      shown.current = to;
      setFrame(null);
      return;
    }
    const places = 10 ** Math.max(decimalsOf(from), decimalsOf(to));
    let raf = 0;
    let start;
    setFrame(from);
    const tick = (t) => {
      if (start === void 0) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      if (p >= 1) {
        shown.current = to;
        setFrame(null);
        return;
      }
      const eased = 1 - (1 - p) ** 3;
      const v = Math.round((from + (to - from) * eased) * places) / places;
      shown.current = v;
      setFrame(v);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);
  const final = formatter.format(value);
  return /* @__PURE__ */ jsx28("span", { ref: elRef, "data-rm-animated-number": "", className: cn("tabular-nums", className), children: frame === null ? final : /* @__PURE__ */ jsxs26(Fragment7, { children: [
    /* @__PURE__ */ jsx28("span", { "aria-hidden": "true", children: formatter.format(frame) }),
    /* @__PURE__ */ jsx28("span", { className: "sr-only", children: final })
  ] }) });
}

// src/components/skeleton.tsx
import { jsx as jsx29 } from "react/jsx-runtime";
var base = cn("animate-pulse", tk.bgMuted);
function Skeleton({
  variant = "text",
  lines = 1,
  width,
  height,
  className,
  style,
  ...props
}) {
  if (variant === "text" && lines > 1) {
    return /* @__PURE__ */ jsx29("div", { className: cn("flex flex-col gap-2", className), "aria-hidden": "true", style, ...props, children: Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsx29(
      "div",
      {
        className: cn(base, "h-4", tk.radiusSm),
        style: { width: i === lines - 1 ? "60%" : width ?? "100%" }
      },
      i
    )) });
  }
  return /* @__PURE__ */ jsx29(
    "div",
    {
      "aria-hidden": "true",
      className: cn(
        base,
        variant === "circle" ? "rounded-full" : tk.radiusSm,
        variant === "text" && "h-4",
        variant === "circle" && !height && "h-10 w-10",
        variant === "rect" && !height && "h-24",
        className
      ),
      style: { width, height, ...style },
      ...props
    }
  );
}

// src/components/stat.tsx
import { jsx as jsx30, jsxs as jsxs27 } from "react/jsx-runtime";
var wholeNumber = new Intl.NumberFormat(void 0, { maximumFractionDigits: 1 });
function Stat({
  label,
  value,
  unit,
  delta,
  deltaLabel = "vs the previous period",
  upIsGood = true,
  trend,
  icon,
  loading = false,
  card = true,
  animate = false,
  emphasis = "default",
  className
}) {
  const inverted = emphasis === "inverted";
  const good = delta !== void 0 && delta !== 0 && delta > 0 === upIsGood;
  const flat = delta === void 0 || delta === 0;
  const quiet = inverted ? tk.fgBackgroundMuted : tk.fgMuted;
  const deltaClass = inverted ? tk.fgBackground : flat ? tk.fgMuted : good ? tk.fgSuccess : tk.fgDestructive;
  const surface = inverted ? cn(tk.bgForeground, tk.borderForeground, tk.fgBackground) : void 0;
  const body = /* @__PURE__ */ jsxs27(
    "div",
    {
      "data-rm-stat-emphasis": inverted ? "inverted" : void 0,
      className: cn("min-w-0 text-left", card ? "px-5 py-4" : void 0, !card && inverted && cn("px-5 py-4", tk.radius, surface), !card && className),
      children: [
        /* @__PURE__ */ jsxs27("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxs27("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx30("div", { className: cn("truncate", textStyles.muted, inverted && quiet), children: label }),
            loading ? /* @__PURE__ */ jsx30(Skeleton, { variant: "text", lines: 1, width: "60%", className: "mt-3 h-6" }) : /* @__PURE__ */ jsxs27("div", { className: cn("mt-1", textStyles.stat, inverted && tk.fgBackground), children: [
              animate && typeof value === "number" ? /* @__PURE__ */ jsx30(AnimatedNumber, { value }) : value,
              unit !== void 0 && /* @__PURE__ */ jsx30("span", { className: cn("ml-1 text-base font-normal tracking-normal", quiet), children: unit })
            ] })
          ] }),
          icon !== void 0 && /* @__PURE__ */ jsx30(
            "div",
            {
              "aria-hidden": "true",
              className: cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                inverted ? cn(tk.bgBackgroundSoft, tk.fgBackground) : cn(tk.bgPrimarySoft, tk.fgPrimary)
              ),
              children: renderIcon(icon, 18)
            }
          )
        ] }),
        delta !== void 0 && !loading && /* @__PURE__ */ jsxs27("div", { className: "mt-2 flex items-center gap-1 text-sm", children: [
          /* @__PURE__ */ jsx30(
            Icon,
            {
              name: delta === 0 ? "minus" : delta > 0 ? "arrow-up" : "arrow-down",
              size: 14,
              strokeWidth: 2.5,
              className: deltaClass
            }
          ),
          /* @__PURE__ */ jsxs27("span", { className: cn("font-medium tabular-nums", deltaClass), children: [
            delta > 0 ? "+" : "",
            wholeNumber.format(delta),
            "%"
          ] }),
          /* @__PURE__ */ jsx30("span", { className: cn("truncate", quiet), children: deltaLabel })
        ] }),
        trend && trend.length > 1 && !loading && /* @__PURE__ */ jsx30(Sparkline, { values: trend, className: "mt-3" })
      ]
    }
  );
  return card ? /* @__PURE__ */ jsx30(Card, { className: cn(surface, className), children: body }) : body;
}

// src/components/meter.tsx
import { useId as useId10 } from "react";
import { jsx as jsx31, jsxs as jsxs28 } from "react/jsx-runtime";
var TONE2 = {
  default: tk.bgPrimary,
  success: tk.bgSuccess,
  warning: tk.bgWarning,
  danger: tk.bgDestructive
};
var TRACK = {
  sm: "h-1.5",
  md: "h-2"
};
var TEXT = {
  sm: "text-xs",
  md: "text-sm"
};
var HATCH = "bg-[image:repeating-linear-gradient(135deg,transparent_0_3px,oklch(var(--rm-muted))_3px_6px)]";
function Meter({
  label,
  value,
  max: max2 = 1,
  segments,
  tone = "default",
  uncertain = false,
  uncertainLabel = "low confidence",
  valueLabel,
  trailing,
  size: size3 = "md",
  className
}) {
  const id = useId10();
  const top = Number.isFinite(max2) && max2 > 0 ? max2 : 1;
  const now = Number.isFinite(value) ? Math.min(top, Math.max(0, value)) : 0;
  const fraction = now / top;
  const cells = segments !== void 0 && segments >= 1 ? Math.floor(segments) : 0;
  const filled = Math.round(fraction * cells);
  const said = typeof valueLabel === "string" || typeof valueLabel === "number" ? String(valueLabel) : typeof trailing === "string" || typeof trailing === "number" ? String(trailing) : cells > 0 ? `${filled} of ${cells}` : `${Math.round(fraction * 100)}%`;
  const fill = cn("h-full", TONE2[tone], uncertain && HATCH);
  return /* @__PURE__ */ jsxs28("div", { "data-rm-meter": "", "data-tone": tone, "data-uncertain": uncertain || void 0, className: cn("w-full text-left", className), children: [
    /* @__PURE__ */ jsxs28("div", { className: cn("mb-1 flex items-baseline justify-between gap-2", TEXT[size3]), children: [
      /* @__PURE__ */ jsx31("span", { id: `${id}-label`, className: cn("min-w-0 truncate", tk.fgMuted), children: label }),
      (valueLabel !== void 0 || trailing !== void 0) && /* @__PURE__ */ jsxs28("span", { className: "flex shrink-0 items-baseline gap-2", children: [
        valueLabel !== void 0 && /* @__PURE__ */ jsx31("span", { className: cn("font-medium", tk.fg), children: valueLabel }),
        trailing !== void 0 && /* @__PURE__ */ jsx31("span", { className: cn("tabular-nums", tk.fgMuted), children: trailing })
      ] })
    ] }),
    /* @__PURE__ */ jsx31(
      "div",
      {
        role: "meter",
        "aria-labelledby": `${id}-label`,
        "aria-valuemin": 0,
        "aria-valuemax": top,
        "aria-valuenow": now,
        "aria-valuetext": uncertain ? `${said}, ${uncertainLabel}` : said,
        className: cn("w-full", TRACK[size3], cells > 0 ? "flex gap-0.5" : cn("overflow-hidden rounded-full", tk.bgMuted)),
        children: cells > 0 ? Array.from({ length: cells }, (_, i) => /* @__PURE__ */ jsx31(
          "span",
          {
            "data-rm-meter-cell": i < filled ? "on" : "off",
            className: cn("h-full flex-1 overflow-hidden rounded-full", tk.bgMuted),
            children: i < filled && /* @__PURE__ */ jsx31("span", { className: cn("block", fill) })
          },
          i
        )) : /* @__PURE__ */ jsx31(
          "div",
          {
            "data-rm-meter-fill": "",
            className: cn("rounded-full transition-[width] duration-300", fill),
            style: { width: `${fraction * 100}%` }
          }
        )
      }
    )
  ] });
}

// src/components/bar-list.tsx
import { useRef as useRef9, useState as useState15 } from "react";
import { Fragment as Fragment8, jsx as jsx32, jsxs as jsxs29 } from "react/jsx-runtime";
var grouped = new Intl.NumberFormat();
function BarList({
  items: items2,
  max: max2,
  sort = "desc",
  limit,
  formatValue,
  onSelect,
  selectedKey,
  animate = false,
  source,
  emptyState = "Nothing to show yet.",
  label,
  className
}) {
  const [expanded, setExpanded] = useState15(false);
  const ranked = sort === "none" ? items2 : [...items2].sort((a, b) => sort === "asc" ? a.value - b.value : b.value - a.value);
  const capped = limit !== void 0 && limit > 0 && ranked.length > limit;
  const shown = capped && !expanded ? ranked.slice(0, limit) : ranked;
  const top = max2 !== void 0 && max2 > 0 ? max2 : Math.max(0, ...items2.map((i) => Number.isFinite(i.value) ? i.value : 0));
  const rowEls = useRef9(/* @__PURE__ */ new Map());
  const tops = useRef9(/* @__PURE__ */ new Map());
  const order2 = shown.map((i) => i.key).join("\n");
  useIsoLayoutEffect(() => {
    const before = tops.current;
    const after = /* @__PURE__ */ new Map();
    for (const [key, el] of rowEls.current) after.set(key, el.offsetTop);
    tops.current = after;
    if (!animate) return;
    for (const [key, el] of rowEls.current) {
      const was = before.get(key);
      const is = after.get(key);
      if (was === void 0 || is === void 0 || was === is || !canAnimate(el)) continue;
      el.style.transition = "none";
      el.style.transform = `translateY(${was - is}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 320ms cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.transform = "";
      });
    }
  }, [order2, animate]);
  if (items2.length === 0) {
    return /* @__PURE__ */ jsx32("div", { "data-rm-bar-list": "", ...source ? sourceLinkAttrs(source) : {}, className: cn("py-6 text-center text-sm", tk.fgMuted, className), children: emptyState });
  }
  return /* @__PURE__ */ jsxs29("div", { "data-rm-bar-list": "", ...source ? sourceLinkAttrs(source) : {}, className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx32("ol", { role: "list", "aria-label": label, className: "flex flex-col gap-1", children: shown.map((item) => {
      const share = top > 0 && Number.isFinite(item.value) ? Math.min(1, Math.max(0, item.value / top)) : 0;
      const selected = selectedKey === item.key;
      const inner = /* @__PURE__ */ jsxs29(Fragment8, { children: [
        /* @__PURE__ */ jsx32(
          "span",
          {
            "aria-hidden": "true",
            "data-rm-bar": "",
            className: cn(
              "absolute inset-y-0 left-0 transition-[width,opacity] duration-300",
              tk.radiusSm,
              tk.bgPrimary,
              selected ? "opacity-40" : "opacity-20"
            ),
            style: { width: `${share * 100}%`, backgroundColor: item.color }
          }
        ),
        /* @__PURE__ */ jsx32("span", { className: cn("relative min-w-0 flex-1 truncate", selected && "font-medium"), children: item.label }),
        /* @__PURE__ */ jsx32("span", { className: cn("relative shrink-0 tabular-nums", selected ? tk.fg : tk.fgMuted), children: formatValue ? formatValue(item.value, item) : grouped.format(item.value) })
      ] });
      const rowClass = cn(
        "relative flex w-full items-center gap-3 px-2 py-1.5 text-left text-sm",
        tk.radiusSm,
        tk.fg
      );
      const pressable = cn(rowClass, "transition-colors", tk.hoverBgMutedHalf, focusRing);
      return /* @__PURE__ */ jsx32(
        "li",
        {
          "data-rm-bar-row": item.key,
          ref: (el) => {
            if (el) rowEls.current.set(item.key, el);
            else rowEls.current.delete(item.key);
          },
          children: item.href ? /* @__PURE__ */ jsx32("a", { href: item.href, "aria-current": selected ? "true" : void 0, onClick: () => onSelect?.(item), className: pressable, children: inner }) : onSelect ? /* @__PURE__ */ jsx32("button", { type: "button", "aria-pressed": selected, onClick: () => onSelect(item), className: pressable, children: inner }) : /* @__PURE__ */ jsx32("div", { className: rowClass, children: inner })
        },
        item.key
      );
    }) }),
    capped && /* @__PURE__ */ jsx32(
      "button",
      {
        type: "button",
        "aria-expanded": expanded,
        onClick: () => setExpanded((e) => !e),
        className: cn("mt-2 px-2 py-1 text-xs font-medium", tk.radiusSm, tk.fgMuted, tk.hoverFg, focusRing),
        children: expanded ? "Show fewer" : `Show all ${ranked.length}`
      }
    )
  ] });
}

// src/components/progress-steps.tsx
import { useEffect as useEffect11, useRef as useRef10, useState as useState16 } from "react";
import { Fragment as Fragment9, jsx as jsx33, jsxs as jsxs30 } from "react/jsx-runtime";
var STATUS_WORDS = {
  pending: "Waiting",
  active: "In progress",
  done: "Done",
  failed: "Failed",
  skipped: "Skipped"
};
var MARKER = {
  pending: cn(tk.fgFaint),
  active: cn("border-2", tk.borderPrimary, tk.bgCard, tk.fgPrimary),
  done: cn(tk.bgPrimary, tk.fgOnPrimary),
  failed: cn(tk.bgDestructive, tk.fgOnDestructive),
  skipped: cn("border border-dashed", tk.borderInput, tk.fgMuted)
};
var LABEL = {
  pending: tk.fgMuted,
  active: cn("font-semibold", tk.fg),
  done: tk.fg,
  failed: cn("font-semibold", tk.fgDestructive),
  skipped: cn("line-through", tk.fgFaint)
};
function ProgressSteps({
  steps,
  orientation = "horizontal",
  label = "Progress",
  statusLabels,
  className
}) {
  const words = { ...STATUS_WORDS, ...statusLabels };
  const vertical = orientation === "vertical";
  const speaking = steps.filter((s) => s.status === "active" || s.status === "failed").map((s) => `${s.key}
${s.status}`).join("\n\n");
  const spoken = useRef10(speaking);
  const [announcement, setAnnouncement] = useState16("");
  useEffect11(() => {
    if (spoken.current === speaking) return;
    const before = new Set(spoken.current.split("\n\n"));
    spoken.current = speaking;
    const fresh = steps.filter(
      (s) => (s.status === "active" || s.status === "failed") && !before.has(`${s.key}
${s.status}`)
    );
    if (fresh.length > 0) setAnnouncement(fresh.map((s) => `${s.label}: ${words[s.status]}`).join(". "));
  }, [speaking]);
  return /* @__PURE__ */ jsxs30("div", { "data-rm-progress-steps": "", "data-orientation": orientation, className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx33("ol", { role: "list", "aria-label": label, className: cn("flex", vertical ? "flex-col" : "items-start"), children: steps.map((step, i) => {
      const last = i === steps.length - 1;
      const rail = cn(step.status === "done" ? tk.bgPrimary : tk.bgBorder);
      const marker = /* @__PURE__ */ jsxs30(
        "span",
        {
          "aria-hidden": "true",
          "data-rm-step-marker": "",
          className: cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", MARKER[step.status]),
          children: [
            step.status === "done" && /* @__PURE__ */ jsx33(Icon, { name: "check", size: 14, strokeWidth: 3 }),
            step.status === "active" && /* @__PURE__ */ jsx33(Icon, { name: "loader-circle", size: 14, strokeWidth: 2.5, className: "animate-spin" }),
            step.status === "failed" && /* @__PURE__ */ jsx33(Icon, { name: "x", size: 14, strokeWidth: 3 }),
            step.status === "skipped" && /* @__PURE__ */ jsx33(Icon, { name: "minus", size: 14 }),
            step.status === "pending" && /* @__PURE__ */ jsx33(Icon, { name: "circle-dashed", size: 24, strokeWidth: 1.5 })
          ]
        }
      );
      const text = /* @__PURE__ */ jsxs30("span", { className: "block min-w-0", children: [
        /* @__PURE__ */ jsx33("span", { className: cn("block truncate text-sm", LABEL[step.status]), children: step.label }),
        /* @__PURE__ */ jsx33("span", { className: "sr-only", children: `(${words[step.status]})` }),
        step.detail !== void 0 && /* @__PURE__ */ jsx33("span", { className: cn("block text-xs", tk.fgMuted), children: step.detail })
      ] });
      return /* @__PURE__ */ jsx33(
        "li",
        {
          "data-rm-step": step.key,
          "data-status": step.status,
          "aria-current": step.status === "active" ? "step" : void 0,
          className: vertical ? "flex min-w-0 gap-3" : cn("flex min-w-0 flex-col gap-1.5", !last && "flex-1"),
          children: vertical ? /* @__PURE__ */ jsxs30(Fragment9, { children: [
            /* @__PURE__ */ jsxs30("span", { className: "flex flex-col items-center", children: [
              marker,
              !last && /* @__PURE__ */ jsx33("span", { "aria-hidden": "true", className: cn("my-1 w-px flex-1", rail) })
            ] }),
            /* @__PURE__ */ jsx33("span", { className: cn("min-w-0 pt-0.5", !last && "pb-4"), children: text })
          ] }) : /* @__PURE__ */ jsxs30(Fragment9, { children: [
            /* @__PURE__ */ jsxs30("span", { className: "flex items-center", children: [
              marker,
              !last && /* @__PURE__ */ jsx33("span", { "aria-hidden": "true", className: cn("mx-2 h-px flex-1", rail) })
            ] }),
            /* @__PURE__ */ jsx33("span", { className: "min-w-0 pr-2", children: text })
          ] })
        },
        step.key
      );
    }) }),
    /* @__PURE__ */ jsx33("span", { "data-rm-progress-announce": "", "aria-live": "polite", className: "sr-only", children: announcement })
  ] });
}

// src/components/stepper.tsx
import {
  Children as Children4,
  isValidElement as isValidElement4,
  useState as useState17
} from "react";
import { jsx as jsx34, jsxs as jsxs31 } from "react/jsx-runtime";
function Stepper({
  value,
  defaultValue: defaultValue2 = 0,
  onChange,
  label = "Steps",
  controls = true,
  backLabel = "Back",
  nextLabel = "Next",
  nextDisabled = false,
  nonLinear = false,
  className,
  children
}) {
  const items2 = Children4.toArray(children);
  const steps = items2.filter((c) => isValidElement4(c) && c.type === Step);
  const rest = items2.filter((c) => !(isValidElement4(c) && c.type === Step));
  const [ownValue, setOwnValue] = useState17(defaultValue2);
  const current = Math.max(0, Math.min(value ?? ownValue, Math.max(0, steps.length - 1)));
  const [furthest, setFurthest] = useState17(current);
  if (current > furthest) setFurthest(current);
  const go = (next) => {
    const clamped = Math.max(0, Math.min(next, steps.length - 1));
    if (value === void 0) setOwnValue(clamped);
    if (clamped > furthest) setFurthest(clamped);
    onChange?.(clamped);
  };
  const last = current >= steps.length - 1;
  return /* @__PURE__ */ jsxs31("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx34("ol", { "aria-label": label, className: "flex flex-wrap items-center gap-x-2 gap-y-2", children: steps.map((child, i) => {
      const props = isValidElement4(child) ? child.props : { title: "" };
      const state = i < current ? "done" : i === current ? "current" : "todo";
      const reachable = nonLinear || i <= furthest;
      return /* @__PURE__ */ jsxs31("li", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs31(
          "button",
          {
            type: "button",
            "aria-current": state === "current" ? "step" : void 0,
            disabled: !reachable || props.disabled,
            onClick: () => go(i),
            className: cn(
              "flex items-center gap-2 px-1.5 py-1 text-left transition-colors disabled:cursor-not-allowed",
              tk.radiusMd,
              focusRing
            ),
            children: [
              /* @__PURE__ */ jsx34(
                "span",
                {
                  "aria-hidden": "true",
                  className: cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    state === "done" && cn(tk.borderPrimary, tk.bgPrimary, tk.fgOnPrimary),
                    state === "current" && cn("border-2", tk.borderPrimary, tk.fgPrimary, tk.bgCard),
                    state === "todo" && cn(tk.border, tk.fgMuted, tk.bgCard)
                  ),
                  children: state === "done" ? /* @__PURE__ */ jsx34(Icon, { name: "check", size: 14, strokeWidth: 3 }) : i + 1
                }
              ),
              /* @__PURE__ */ jsxs31("span", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxs31("span", { className: cn("block text-sm font-medium", state === "current" ? tk.fg : tk.fgMuted), children: [
                  props.title,
                  props.optional && /* @__PURE__ */ jsx34("span", { className: cn("ml-1 text-xs font-normal", tk.fgFaint), children: "(optional)" })
                ] }),
                props.description !== void 0 && /* @__PURE__ */ jsx34("span", { className: cn("block text-xs", tk.fgMuted), children: props.description })
              ] })
            ]
          }
        ),
        i < steps.length - 1 && // The segment behind a finished step is drawn in the accent,
        // so the rail reads as "this far, and no further".
        /* @__PURE__ */ jsx34(
          "span",
          {
            "aria-hidden": "true",
            className: cn("hidden h-px w-8 sm:block", state === "done" ? tk.bgPrimary : tk.bgBorder)
          }
        )
      ] }, i);
    }) }),
    /* @__PURE__ */ jsx34("div", { className: "mt-4", children: steps[current] }),
    controls && steps.length > 1 && /* @__PURE__ */ jsxs31("div", { className: "mt-5 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx34(Button, { variant: "secondary", disabled: current === 0, onClick: () => go(current - 1), children: backLabel }),
      !last && /* @__PURE__ */ jsx34(Button, { disabled: nextDisabled, onClick: () => go(current + 1), children: nextLabel })
    ] }),
    rest
  ] });
}
function Step({ className, children }) {
  return /* @__PURE__ */ jsx34("div", { className: cn("text-left", className), children });
}

// src/components/accordion.tsx
import {
  createContext as createContext4,
  useContext as useContext5,
  useId as useId11,
  useRef as useRef11,
  useState as useState18
} from "react";
import { jsx as jsx35, jsxs as jsxs32 } from "react/jsx-runtime";
var AccordionContext = createContext4(null);
function Accordion({
  type = "multiple",
  value,
  defaultValue: defaultValue2,
  onChange,
  className,
  children
}) {
  const baseId = useId11();
  const [ownValue, setOwnValue] = useState18(defaultValue2 ?? []);
  const open = value ?? ownValue;
  const rootRef = useRef11(null);
  const set = (next) => {
    if (value === void 0) setOwnValue(next);
    onChange?.(next);
  };
  const ctx = {
    baseId,
    isOpen: (v) => open.includes(v),
    toggle: (v) => {
      if (open.includes(v)) set(open.filter((x) => x !== v));
      else set(type === "single" ? [v] : [...open, v]);
    }
  };
  const onKeyDown = (e) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const headers = Array.from(
      rootRef.current?.querySelectorAll("button[data-rm-accordion-header]:not([disabled])") ?? []
    );
    const current = headers.findIndex((b) => b === document.activeElement);
    if (current === -1) return;
    e.preventDefault();
    let next = current;
    if (e.key === "ArrowDown") next = (current + 1) % headers.length;
    else if (e.key === "ArrowUp") next = (current - 1 + headers.length) % headers.length;
    else if (e.key === "Home") next = 0;
    else next = headers.length - 1;
    headers[next]?.focus();
  };
  return /* @__PURE__ */ jsx35(AccordionContext.Provider, { value: ctx, children: /* @__PURE__ */ jsx35(
    "div",
    {
      ref: rootRef,
      onKeyDown,
      className: cn("divide-y border text-left", tk.divide, tk.radius, tk.border, tk.bgCard, className),
      children
    }
  ) });
}
function AccordionItem({
  value,
  title,
  description,
  meta,
  disabled = false,
  className,
  children
}) {
  const ctx = useContext5(AccordionContext);
  const open = ctx?.isOpen(value) ?? false;
  const headerId = `${ctx?.baseId ?? "acc"}-h-${value}`;
  const panelId = `${ctx?.baseId ?? "acc"}-p-${value}`;
  return /* @__PURE__ */ jsxs32("div", { className, children: [
    /* @__PURE__ */ jsx35("h3", { className: "m-0", children: /* @__PURE__ */ jsxs32(
      "button",
      {
        type: "button",
        id: headerId,
        "data-rm-accordion-header": "",
        "aria-expanded": open,
        "aria-controls": panelId,
        disabled,
        onClick: () => ctx?.toggle(value),
        className: cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50",
          interactiveRow,
          focusRing
        ),
        children: [
          /* @__PURE__ */ jsx35(
            Icon,
            {
              name: "chevron-down",
              size: 16,
              className: cn("transition-transform", tk.fgMuted, open && "rotate-180")
            }
          ),
          /* @__PURE__ */ jsxs32("span", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx35("span", { className: cn("block text-sm font-medium", tk.fg), children: title }),
            description !== void 0 && /* @__PURE__ */ jsx35("span", { className: cn("mt-0.5 block text-xs", tk.fgMuted), children: description })
          ] }),
          meta !== void 0 && /* @__PURE__ */ jsx35("span", { className: "shrink-0 text-xs", children: meta })
        ]
      }
    ) }),
    open && // The grid wrapper is what the stylesheet animates (grid-template-rows
    // from 0fr to 1fr); the inner box clips the content while it grows.
    /* @__PURE__ */ jsx35("div", { className: "grid", "data-rm-anim": "collapse", "data-state": "open", children: /* @__PURE__ */ jsx35(
      "div",
      {
        id: panelId,
        role: "region",
        "aria-labelledby": headerId,
        className: cn("min-h-0 overflow-hidden px-4 pb-4 pt-1 text-sm", tk.fg),
        children
      }
    ) })
  ] });
}

// src/components/timeline.tsx
import { Children as Children5 } from "react";

// src/components/status-badge.tsx
import { jsx as jsx36 } from "react/jsx-runtime";
var VARIANT = {
  ok: "success",
  warn: "warning",
  error: "danger",
  pending: "neutral"
};
var LABEL2 = {
  ok: "OK",
  warn: "Warning",
  error: "Error",
  pending: "Pending"
};
function statusDotClass(status) {
  return badgeDotClass(VARIANT[status]);
}
function StatusBadge({ status, children, ...props }) {
  return /* @__PURE__ */ jsx36(Badge, { variant: VARIANT[status], dot: true, ...props, children: children ?? LABEL2[status] });
}

// src/components/timeline.tsx
import { jsx as jsx37, jsxs as jsxs33 } from "react/jsx-runtime";
function Timeline({ children, className, ...props }) {
  const items2 = Children5.toArray(children);
  return /* @__PURE__ */ jsx37("ol", { className: cn("relative text-left", className), ...props, children: items2.map((child, i) => /* @__PURE__ */ jsxs33("li", { className: "relative pb-5 pl-6 last:pb-0", children: [
    i < items2.length - 1 && /* @__PURE__ */ jsx37("span", { "aria-hidden": "true", className: cn("absolute left-[5px] top-3 h-full w-px", tk.bgBorder) }),
    child
  ] }, i)) });
}
function TimelineItem({ at, title, body, status = "pending", by, className, children }) {
  return /* @__PURE__ */ jsxs33("div", { className: cn("min-w-0", className), children: [
    /* @__PURE__ */ jsx37(
      "span",
      {
        "aria-hidden": "true",
        className: cn("absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ring-4", tk.ringCard, statusDotClass(status))
      }
    ),
    /* @__PURE__ */ jsxs33("div", { className: "flex flex-wrap items-baseline gap-x-2 gap-y-0.5", children: [
      /* @__PURE__ */ jsx37("span", { className: cn("text-sm font-medium", tk.fg), children: title }),
      at !== void 0 && /* @__PURE__ */ jsx37("span", { className: cn("text-xs", tk.fgMuted), children: formatAt(at) })
    ] }),
    body !== void 0 && /* @__PURE__ */ jsx37("div", { className: cn("mt-0.5 text-sm", tk.fgMuted), children: body }),
    by !== void 0 && /* @__PURE__ */ jsx37("div", { className: "mt-1.5 flex items-center gap-2 text-xs", children: by }),
    children !== void 0 && /* @__PURE__ */ jsx37("div", { className: "mt-2", children })
  ] });
}
function formatAt(at) {
  if (typeof at !== "string") return at;
  const ms = Date.parse(at);
  if (Number.isNaN(ms) || !/^\d{4}-\d{2}-\d{2}/.test(at)) return at;
  return new Date(ms).toLocaleString(void 0, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// src/components/avatar.tsx
import { Children as Children6 } from "react";
import { Fragment as Fragment10, jsx as jsx38, jsxs as jsxs34 } from "react/jsx-runtime";
var SIZES3 = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg"
};
var RING = {
  xs: "-ml-1.5 ring-2",
  sm: "-ml-2 ring-2",
  md: "-ml-2.5 ring-2",
  lg: "-ml-3 ring-2"
};
function Avatar({ name, src, size: size3 = "md", fallback, className, ...props }) {
  const label = name?.trim() || "Unknown person";
  return /* @__PURE__ */ jsx38(
    "span",
    {
      title: name || void 0,
      className: cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium",
        tk.bgPrimarySoft,
        tk.fgPrimary,
        SIZES3[size3],
        className
      ),
      ...props,
      children: src ? (
        // A picture that 404s must leave the initials showing rather than the
        // browser's broken-image glyph, so the initials are painted behind it
        // and the <img> simply hides itself when it cannot load.
        /* @__PURE__ */ jsxs34(Fragment10, { children: [
          /* @__PURE__ */ jsx38("span", { "aria-hidden": "true", className: "absolute inset-0 flex items-center justify-center", children: fallback ?? initials(label) }),
          /* @__PURE__ */ jsx38(
            "img",
            {
              src,
              alt: label,
              className: "relative h-full w-full object-cover",
              onError: (e) => {
                e.currentTarget.style.display = "none";
              }
            }
          )
        ] })
      ) : /* @__PURE__ */ jsx38("span", { "aria-label": label, role: "img", children: fallback ?? initials(label) })
    }
  );
}
function AvatarGroup({ max: max2 = 4, size: size3 = "sm", children, className, ...props }) {
  const all = Children6.toArray(children);
  const shown = all.slice(0, max2);
  const extra = all.length - shown.length;
  return /* @__PURE__ */ jsxs34("div", { className: cn("flex items-center", className), ...props, children: [
    shown.map((child, i) => /* @__PURE__ */ jsx38("span", { className: cn("rounded-full", tk.ringCard, i === 0 ? "ml-0 ring-2" : RING[size3]), children: child }, i)),
    extra > 0 && /* @__PURE__ */ jsxs34(
      "span",
      {
        className: cn(
          "inline-flex items-center justify-center rounded-full font-medium ring-2",
          tk.bgMuted,
          tk.fgMuted,
          tk.ringCard,
          SIZES3[size3],
          RING[size3]
        ),
        children: [
          "+",
          extra
        ]
      }
    )
  ] });
}
function initials(name) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// src/components/image.tsx
import { useEffect as useEffect13, useRef as useRef13, useState as useState20 } from "react";

// src/image-source.ts
import { useFileUrl } from "@robomotion/apps-runtime/react";
function useImageSource(src, file) {
  const resolved = useFileUrl(src ? void 0 : file);
  return {
    url: src || resolved.url,
    resolving: !src && resolved.loading,
    failed: !src && !!resolved.error,
    refresh: resolved.refresh,
    fromFile: !src && !!file
  };
}

// src/components/lightbox.tsx
import {
  useCallback as useCallback5,
  useEffect as useEffect12,
  useRef as useRef12,
  useState as useState19
} from "react";
import { jsx as jsx39, jsxs as jsxs35 } from "react/jsx-runtime";
var VEIL = "bg-[color:oklch(0.16_0.01_260/0.94)]";
var ON_VEIL = "text-[color:oklch(1_0_0/0.92)]";
var ON_VEIL_MUTED = "text-[color:oklch(1_0_0/0.64)]";
var VEIL_CONTROL = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:oklch(1_0_0/0.8)] transition-colors hover:bg-[color:oklch(1_0_0/0.14)] hover:text-[color:oklch(1_0_0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:oklch(1_0_0/0.9)] disabled:cursor-not-allowed disabled:opacity-30";
var MIN_SCALE = 1;
var MAX_SCALE = 8;
var FIT = { scale: 1, x: 0, y: 0 };
function Lightbox({
  open,
  onClose,
  items: items2,
  index,
  defaultIndex = 0,
  onIndexChange,
  actions,
  className
}) {
  const { panelRef, onKeyDown: overlayKeyDown } = useOverlay(open, onClose);
  const presence = usePresence(open);
  const [own, setOwn] = useState19(defaultIndex);
  const count = items2.length;
  const at = clamp2(index ?? own, 0, Math.max(0, count - 1));
  const item = items2[at];
  const [view, setView] = useState19(FIT);
  const viewRef = useRef12(view);
  viewRef.current = view;
  const stageRef = useRef12(null);
  useEffect12(() => {
    setView(FIT);
  }, [at, open]);
  useEffect12(() => {
    if (open && index === void 0) setOwn(clamp2(defaultIndex, 0, Math.max(0, count - 1)));
  }, [open]);
  const go = useCallback5(
    (next) => {
      if (count === 0) return;
      const to = clamp2(next, 0, count - 1);
      if (to === at) return;
      if (index === void 0) setOwn(to);
      onIndexChange?.(to);
    },
    [at, count, index, onIndexChange]
  );
  const zoomAbout = useCallback5((factor, px = 0, py = 0) => {
    setView((v) => {
      const scale = clamp2(v.scale * factor, MIN_SCALE, MAX_SCALE);
      if (scale === MIN_SCALE) return FIT;
      const k = scale / v.scale;
      return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  }, []);
  const pan = useCallback5((dx, dy) => {
    setView((v) => v.scale <= MIN_SCALE ? v : { ...v, x: v.x + dx, y: v.y + dy });
  }, []);
  useEffect12(() => {
    const stage = stageRef.current;
    if (!open || !stage) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      zoomAbout(Math.exp(-e.deltaY * 15e-4), e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [open, zoomAbout, presence.present]);
  const pointers = useRef12(/* @__PURE__ */ new Map());
  const [dragging, setDragging] = useState19(false);
  useEffect12(() => {
    if (!dragging) return;
    const held = pointers.current;
    const onMove = (e) => {
      const prev = held.get(e.pointerId);
      if (!prev) return;
      const stage = stageRef.current;
      if (held.size === 1) {
        pan(e.clientX - prev.x, e.clientY - prev.y);
      } else if (held.size === 2 && stage) {
        const other = Array.from(held.entries()).find(([id]) => id !== e.pointerId)?.[1];
        if (other) {
          const before = Math.hypot(prev.x - other.x, prev.y - other.y);
          const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
          const r = stage.getBoundingClientRect();
          const cx2 = (e.clientX + other.x) / 2 - r.left - r.width / 2;
          const cy = (e.clientY + other.y) / 2 - r.top - r.height / 2;
          if (before > 0) zoomAbout(after / before, cx2, cy);
        }
      }
      held.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const onUp = (e) => {
      held.delete(e.pointerId);
      if (held.size === 0) setDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      held.clear();
    };
  }, [dragging, pan, zoomAbout]);
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
  };
  const onKeyDown = (e) => {
    const zoomed2 = viewRef.current.scale > MIN_SCALE;
    const step = e.shiftKey ? 240 : 60;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        if (zoomed2) pan(step, 0);
        else go(at - 1);
        return;
      case "ArrowRight":
        e.preventDefault();
        if (zoomed2) pan(-step, 0);
        else go(at + 1);
        return;
      case "ArrowUp":
        if (zoomed2) {
          e.preventDefault();
          pan(0, step);
        }
        return;
      case "ArrowDown":
        if (zoomed2) {
          e.preventDefault();
          pan(0, -step);
        }
        return;
      case "Home":
        e.preventDefault();
        go(0);
        return;
      case "End":
        e.preventDefault();
        go(count - 1);
        return;
      case "+":
      case "=":
        e.preventDefault();
        zoomAbout(1.5);
        return;
      case "-":
      case "_":
        e.preventDefault();
        zoomAbout(1 / 1.5);
        return;
      case "0":
        e.preventDefault();
        setView(FIT);
        return;
      default:
        overlayKeyDown(e);
    }
  };
  if (!presence.present || !item) return null;
  const zoomed = view.scale > MIN_SCALE;
  const extra = typeof actions === "function" ? actions(item, at) : actions;
  return /* @__PURE__ */ jsx39(OverlayPortal, { children: /* @__PURE__ */ jsxs35(
    "div",
    {
      ref: (el) => {
        panelRef.current = el;
        presence.ref(el);
      },
      role: "dialog",
      "aria-modal": "true",
      "aria-label": item.alt || "Picture viewer",
      tabIndex: -1,
      onKeyDown,
      "data-rm-lightbox": "",
      "data-rm-anim": "fade",
      "data-state": presence.state,
      className: cn("fixed inset-0 z-50 flex flex-col outline-none", VEIL, ON_VEIL, className),
      children: [
        /* @__PURE__ */ jsxs35("div", { className: "flex items-center gap-1 px-3 py-2", children: [
          /* @__PURE__ */ jsx39("span", { "aria-live": "polite", className: cn("min-w-0 flex-1 truncate px-1 text-sm tabular-nums", ON_VEIL_MUTED), children: count > 1 ? `${at + 1} / ${count}` : "" }),
          extra !== void 0 && /* @__PURE__ */ jsx39("div", { className: "flex items-center gap-2 pr-2", children: extra }),
          /* @__PURE__ */ jsx39(VeilButton, { icon: "zoom-out", label: "Zoom out", disabled: !zoomed, onClick: () => zoomAbout(1 / 1.5) }),
          /* @__PURE__ */ jsx39(VeilButton, { icon: "zoom-in", label: "Zoom in", disabled: view.scale >= MAX_SCALE, onClick: () => zoomAbout(1.5) }),
          /* @__PURE__ */ jsx39(VeilButton, { icon: "x", label: "Close", onClick: onClose })
        ] }),
        /* @__PURE__ */ jsxs35("div", { className: "relative flex min-h-0 flex-1 items-center", children: [
          count > 1 && /* @__PURE__ */ jsx39(
            VeilButton,
            {
              icon: "chevron-left",
              label: "Previous picture",
              disabled: at === 0,
              onClick: () => go(at - 1),
              className: "absolute left-2 z-10 sm:left-4"
            }
          ),
          /* @__PURE__ */ jsx39(
            "div",
            {
              ref: stageRef,
              "data-rm-lightbox-stage": "",
              onPointerDown,
              onDoubleClick: (e) => {
                const r = e.currentTarget.getBoundingClientRect();
                if (zoomed) setView(FIT);
                else zoomAbout(2.5, e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
              },
              onClick: (e) => {
                if (e.target === e.currentTarget && !zoomed) onClose();
              },
              className: cn(
                "flex h-full w-full touch-none select-none items-center justify-center overflow-hidden px-12 sm:px-16",
                zoomed ? dragging ? "cursor-grabbing" : "cursor-grab" : "cursor-zoom-in"
              ),
              children: /* @__PURE__ */ jsx39(Slide, { item, view, moving: dragging }, item.key ?? at)
            }
          ),
          count > 1 && /* @__PURE__ */ jsx39(
            VeilButton,
            {
              icon: "chevron-right",
              label: "Next picture",
              disabled: at === count - 1,
              onClick: () => go(at + 1),
              className: "absolute right-2 z-10 sm:right-4"
            }
          )
        ] }),
        /* @__PURE__ */ jsx39("div", { className: cn("min-h-[2.5rem] px-4 pb-3 pt-2 text-center text-sm", ON_VEIL_MUTED), children: item.caption })
      ]
    }
  ) });
}
function Slide({ item, view, moving }) {
  const { url, failed, resolving } = useImageSource(item.src, item.file);
  const [broken, setBroken] = useState19(false);
  if (broken || failed || !url && !resolving) {
    return /* @__PURE__ */ jsx39("span", { role: "img", "aria-label": item.alt ? `${item.alt} (picture unavailable)` : "Picture unavailable", children: /* @__PURE__ */ jsx39(Icon, { name: "image-off", size: 32, strokeWidth: 1.5 }) });
  }
  if (!url) return /* @__PURE__ */ jsx39(Icon, { name: "loader-circle", size: 24, className: "animate-spin", label: "Loading" });
  return /* @__PURE__ */ jsx39(
    "img",
    {
      src: url,
      alt: item.alt,
      draggable: false,
      onError: () => setBroken(true),
      style: { transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` },
      className: cn("max-h-full max-w-full object-contain", !moving && "transition-transform duration-150 ease-out")
    }
  );
}
function VeilButton({
  icon,
  label,
  onClick,
  disabled,
  className
}) {
  return /* @__PURE__ */ jsx39("button", { type: "button", "aria-label": label, title: label, disabled, onClick, className: cn(VEIL_CONTROL, className), children: /* @__PURE__ */ jsx39(Icon, { name: icon, size: 20 }) });
}
function clamp2(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

// src/components/image.tsx
import { Fragment as Fragment11, jsx as jsx40, jsxs as jsxs36 } from "react/jsx-runtime";
var ASPECT = {
  auto: "",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "3:4": "aspect-[3/4]",
  "4:5": "aspect-[4/5]",
  "3:2": "aspect-[3/2]",
  "2:3": "aspect-[2/3]",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]"
};
var RADIUS = {
  none: "rounded-none",
  sm: tk.radiusSm,
  md: tk.radiusMd,
  lg: tk.radius
};
function Image({
  src,
  file,
  placeholder,
  alt,
  aspect = "auto",
  fit = "cover",
  radius = "md",
  zoomable = false,
  caption,
  loading = "lazy",
  crossOrigin,
  fallback,
  onLoad,
  onError,
  className,
  style
}) {
  const { url, resolving, failed, refresh, fromFile } = useImageSource(src, file);
  const [status, setStatus] = useState20(url ? "loading" : "idle");
  const [open, setOpen] = useState20(false);
  const imgRef = useRef13(null);
  const retried = useRef13(false);
  useEffect13(() => {
    setStatus(url ? "loading" : "idle");
    const el = imgRef.current;
    if (url && el && el.complete && el.naturalWidth > 0) setStatus("loaded");
  }, [url]);
  useEffect13(() => {
    retried.current = false;
  }, [file?.artifact_id, src]);
  const handleLoad = (e) => {
    setStatus("loaded");
    onLoad?.({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight });
  };
  const handleError = () => {
    if (fromFile && !retried.current) {
      retried.current = true;
      refresh();
      return;
    }
    setStatus("error");
    onError?.();
  };
  const broken = status === "error" || failed || !url && !resolving;
  const waiting = !broken && status !== "loaded";
  const auto = aspect === "auto";
  const ratioStyle = typeof aspect === "number" && aspect > 0 ? { aspectRatio: String(aspect) } : void 0;
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  return /* @__PURE__ */ jsxs36(
    "span",
    {
      "data-rm-image": "",
      "data-state": broken ? "error" : status === "loaded" ? "loaded" : "loading",
      className: cn(
        "relative block overflow-hidden",
        tk.bgMuted,
        RADIUS[radius],
        typeof aspect === "string" ? ASPECT[aspect] : void 0,
        // With no shape of its own the box needs some height to show the
        // placeholder in; the picture replaces it when it lands.
        auto && status !== "loaded" && "min-h-[6rem]",
        className
      ),
      style: { ...ratioStyle, ...style },
      children: [
        waiting && !placeholder && /* @__PURE__ */ jsx40(Skeleton, { variant: "rect", className: "absolute inset-0 h-full w-full rounded-none" }),
        waiting && placeholder && /* @__PURE__ */ jsx40(
          "img",
          {
            src: placeholder,
            alt: "",
            "aria-hidden": "true",
            "data-rm-image-placeholder": "",
            className: cn("absolute inset-0 h-full w-full scale-110 blur-md", fitClass)
          }
        ),
        url && !broken && /* @__PURE__ */ jsx40(
          "img",
          {
            ref: imgRef,
            src: url,
            alt,
            loading,
            decoding: "async",
            crossOrigin,
            draggable: false,
            onLoad: handleLoad,
            onError: handleError,
            className: cn(
              "transition-opacity duration-300",
              auto ? "relative block h-auto w-full" : cn("absolute inset-0 h-full w-full", fitClass),
              status === "loaded" ? "opacity-100" : "opacity-0"
            )
          }
        ),
        broken && (fallback !== void 0 ? /* @__PURE__ */ jsx40("span", { className: "absolute inset-0 flex items-center justify-center", children: fallback }) : /* @__PURE__ */ jsx40(
          "span",
          {
            role: "img",
            "aria-label": alt ? `${alt} (picture unavailable)` : "Picture unavailable",
            className: cn("absolute inset-0 flex items-center justify-center", tk.fgFaint),
            children: /* @__PURE__ */ jsx40(Icon, { name: "image-off", size: 24, strokeWidth: 1.5 })
          }
        )),
        zoomable && !broken && /* @__PURE__ */ jsxs36(Fragment11, { children: [
          /* @__PURE__ */ jsx40(
            "button",
            {
              type: "button",
              "aria-label": alt ? `View ${alt} full screen` : "View full screen",
              onClick: () => setOpen(true),
              className: cn("absolute inset-0 cursor-zoom-in", RADIUS[radius], focusRing, "focus-visible:ring-inset focus-visible:ring-offset-0")
            }
          ),
          /* @__PURE__ */ jsx40(
            Lightbox,
            {
              open,
              onClose: () => setOpen(false),
              items: [{ src: url, alt, caption }]
            }
          )
        ] })
      ]
    }
  );
}

// src/components/image-markup.tsx
import {
  forwardRef as forwardRef5,
  useCallback as useCallback6,
  useEffect as useEffect14,
  useImperativeHandle,
  useRef as useRef14,
  useState as useState21
} from "react";

// src/geometry.ts
function clamp01(n) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}
function clampPoint(p) {
  return [clamp01(p[0]), clamp01(p[1])];
}
function rectFromCorners(a, b) {
  const x = Math.min(a[0], b[0]);
  const y = Math.min(a[1], b[1]);
  return [x, y, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])];
}
function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
function distanceToSegment(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return distance(p, a);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return distance(p, [a[0] + t * dx, a[1] + t * dy]);
}
function simplifyPath(points, epsilon) {
  const n = points.length;
  if (n <= 2 || epsilon <= 0) return points.slice();
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop();
    let worst = 0;
    let at = -1;
    for (let i = first + 1; i < last; i++) {
      const d = distanceToSegment(points[i], points[first], points[last]);
      if (d > worst) {
        worst = d;
        at = i;
      }
    }
    if (at !== -1 && worst > epsilon) {
      keep[at] = 1;
      stack.push([first, at], [at, last]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(points[i]);
  return out;
}
function boundsOf(points) {
  if (points.length === 0) return [0, 0, 0, 0];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX - minX, maxY - minY];
}
function translateWithin(points, dx, dy) {
  const [x, y, w, h] = boundsOf(points);
  const mx = Math.max(-x, Math.min(1 - (x + w), dx));
  const my = Math.max(-y, Math.min(1 - (y + h), dy));
  return points.map(([px, py]) => [px + mx, py + my]);
}

// src/components/image-markup.tsx
import { Fragment as Fragment12, jsx as jsx41, jsxs as jsxs37 } from "react/jsx-runtime";
var MARK_EXPORT_COLOR = "#FF00FF";
var ALL_TOOLS = ["select", "pin", "box", "arrow", "freehand", "brush"];
var TOOL_META = {
  select: { icon: "mouse-pointer-2", label: "Select and move" },
  pin: { icon: "map-pin", label: "Pin" },
  box: { icon: "square-dashed", label: "Box" },
  arrow: { icon: "move-up-right", label: "Arrow" },
  freehand: { icon: "pen-line", label: "Draw" },
  brush: { icon: "brush", label: "Paint a region" }
};
var KIND_LABEL = {
  pin: "Pin",
  box: "Box",
  arrow: "Arrow",
  freehand: "Drawing",
  brush: "Region"
};
var TONE_STROKE = {
  default: "oklch(var(--rm-primary))",
  danger: "oklch(var(--rm-destructive))"
};
var TONE_WASH = {
  default: "oklch(var(--rm-primary) / 0.1)",
  danger: "oklch(var(--rm-destructive) / 0.1)"
};
var TONE_PAINT = {
  default: "oklch(var(--rm-primary) / 0.38)",
  danger: "oklch(var(--rm-destructive) / 0.38)"
};
var HALO = "oklch(1 0 0 / 0.9)";
var BADGE_TONE = {
  default: cn(tk.bgPrimary, tk.fgOnPrimary),
  danger: cn(tk.bgDestructive, tk.fgOnDestructive)
};
var HIT_PIN = 14;
var HIT_LINE = 8;
var HIT_HANDLE = 11;
var ARROW_HEAD = 13;
var MIN_BOX = 0.012;
var MIN_ARROW = 0.02;
var NUDGE = 0.01;
var SIMPLIFY = 25e-4;
function renumberMarks(marks) {
  return marks.map((m, i) => m.n === i + 1 ? m : { ...m, n: i + 1 });
}
function markAnchor(m) {
  if (m.kind === "pin" && m.at) return m.at;
  if (m.kind === "box" && m.rect) return [m.rect[0], m.rect[1]];
  if (m.points && m.points.length > 0) return m.points[0];
  return [0.5, 0.5];
}
function moveMark(m, dx, dy) {
  if (m.kind === "pin" && m.at) return { ...m, at: clampPoint([m.at[0] + dx, m.at[1] + dy]) };
  if (m.kind === "box" && m.rect) {
    const [x, y, w, h] = m.rect;
    return { ...m, rect: [clampTo(x + dx, 0, 1 - w), clampTo(y + dy, 0, 1 - h), w, h] };
  }
  if (m.points) return { ...m, points: translateWithin(m.points, dx, dy) };
  return m;
}
function resizeMark(m, dx, dy) {
  if (m.kind === "box" && m.rect) {
    const [x, y, w, h] = m.rect;
    return { ...m, rect: [x, y, clampTo(w + dx, MIN_BOX, 1 - x), clampTo(h + dy, MIN_BOX, 1 - y)] };
  }
  if (m.kind === "arrow" && m.points && m.points.length === 2) {
    return { ...m, points: [clampPoint([m.points[0][0] + dx, m.points[0][1] + dy]), m.points[1]] };
  }
  if (m.kind === "brush") {
    const grow = dx !== 0 ? dx : -dy;
    return { ...m, width: clampTo((m.width ?? 0.06) + grow, 0.01, 0.5) };
  }
  return m;
}
function dragHandle(origin, handle, p) {
  if (origin.kind === "box" && origin.rect) {
    const [x, y, w, h] = origin.rect;
    const fixed = handle === "nw" ? [x + w, y + h] : handle === "ne" ? [x, y + h] : handle === "sw" ? [x + w, y] : [x, y];
    const r = rectFromCorners(fixed, clampPoint(p));
    return { ...origin, rect: [r[0], r[1], Math.max(r[2], MIN_BOX), Math.max(r[3], MIN_BOX)] };
  }
  if (origin.kind === "arrow" && origin.points && origin.points.length === 2) {
    const q = clampPoint(p);
    return { ...origin, points: handle === "from" ? [q, origin.points[1]] : [origin.points[0], q] };
  }
  return origin;
}
function handlesOf(m) {
  if (m.kind === "box" && m.rect) {
    const [x, y, w, h] = m.rect;
    return [
      { id: "nw", at: [x, y] },
      { id: "ne", at: [x + w, y] },
      { id: "sw", at: [x, y + h] },
      { id: "se", at: [x + w, y + h] }
    ];
  }
  if (m.kind === "arrow" && m.points && m.points.length === 2) {
    return [
      { id: "from", at: m.points[0] },
      { id: "to", at: m.points[1] }
    ];
  }
  return [];
}
function hitTestMarks(marks, p, w, h) {
  const px = (q) => [q[0] * w, q[1] * h];
  const at = px(p);
  for (let i = marks.length - 1; i >= 0; i--) {
    const m = marks[i];
    if (m.kind === "pin" && m.at) {
      if (distance(at, px(m.at)) <= HIT_PIN) return m;
    } else if (m.kind === "box" && m.rect) {
      const [x, y, rw, rh] = m.rect;
      const pad = 4;
      if (at[0] >= x * w - pad && at[0] <= (x + rw) * w + pad && at[1] >= y * h - pad && at[1] <= (y + rh) * h + pad) return m;
    } else if (m.points && m.points.length > 0) {
      const reach = m.kind === "brush" ? Math.max(HIT_LINE, (m.width ?? 0.06) * w / 2) : HIT_LINE;
      const pts = m.points.map(px);
      if (pts.length === 1 && distance(at, pts[0]) <= reach) return m;
      for (let k = 1; k < pts.length; k++) {
        if (distanceToSegment(at, pts[k - 1], pts[k]) <= reach) return m;
      }
    }
  }
  return void 0;
}
function arrowHead(from, to, size3) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const bx = to[0] - ux * size3;
  const by = to[1] - uy * size3;
  const half = size3 * 0.55;
  return [to, [bx - uy * half, by + ux * half], [bx + uy * half, by - ux * half]];
}
function clampTo(n, lo, hi) {
  return Math.min(Math.max(n, lo), Math.max(lo, hi));
}
var markSeq = 0;
function newMarkId() {
  markSeq += 1;
  return `m${Date.now().toString(36)}${markSeq.toString(36)}`;
}
function centreMark(kind, brushWidth) {
  switch (kind) {
    case "pin":
      return { kind, at: [0.5, 0.5] };
    case "box":
      return { kind, rect: [0.35, 0.35, 0.3, 0.3] };
    case "arrow":
      return { kind, points: [[0.32, 0.68], [0.5, 0.5]] };
    case "freehand":
      return { kind, points: [[0.4, 0.5], [0.6, 0.5]] };
    case "brush":
      return { kind, points: [[0.42, 0.5], [0.58, 0.5]], width: brushWidth };
  }
}
var ImageMarkup = forwardRef5(function ImageMarkup2({
  src,
  file,
  alt,
  marks,
  onMarksChange,
  tool,
  onToolChange,
  tools = ALL_TOOLS,
  readOnly = false,
  numbered = true,
  selectedId,
  onSelect,
  maxMarks,
  noteOnCreate = false,
  tone = "default",
  brushWidth = 0.06,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  maxHeight = "70vh",
  className
}, ref) {
  const { url, resolving, failed, refresh, fromFile } = useImageSource(src, file);
  const { ref: boxRef, width: vw0, height: vh0 } = useMeasure();
  const vw = vw0 || 1e3;
  const vh = vh0 || 1e3;
  const imgRef = useRef14(null);
  const [broken, setBroken] = useState21(false);
  const retried = useRef14(false);
  useEffect14(() => {
    setBroken(false);
    retried.current = false;
  }, [url]);
  const controlled = selectedId !== void 0 || onSelect !== void 0;
  const [ownSelected, setOwnSelected] = useState21(void 0);
  const selected = controlled ? selectedId : ownSelected;
  const select = useCallback6(
    (id) => {
      if (!controlled) setOwnSelected(id);
      onSelect?.(id);
    },
    [controlled, onSelect]
  );
  const [gesture, setGesture] = useState21(null);
  const [draft, setDraft] = useState21(null);
  const [editing, setEditing] = useState21(null);
  const [said, setSaid] = useState21("");
  const live = useRef14({ marks, draft, gesture, tone, brushWidth });
  live.current = { marks, draft, gesture, tone, brushWidth };
  const stroke = useRef14([]);
  const badges = useRef14(/* @__PURE__ */ new Map());
  const full = maxMarks !== void 0 && marks.length >= maxMarks;
  const toPoint = useCallback6(
    (clientX, clientY) => {
      const r = boxRef.current?.getBoundingClientRect();
      if (!r || r.width === 0 || r.height === 0) return null;
      return [clamp01((clientX - r.left) / r.width), clamp01((clientY - r.top) / r.height)];
    },
    [boxRef]
  );
  const screenSize = useCallback6(() => {
    const r = boxRef.current?.getBoundingClientRect();
    return { w: r?.width || vw, h: r?.height || vh };
  }, [boxRef, vw, vh]);
  const commit = useCallback6(
    (next, message) => {
      onMarksChange(next);
      if (message) setSaid(message);
    },
    [onMarksChange]
  );
  const addMark = useCallback6(
    (shape) => {
      const current2 = live.current.marks;
      if (maxMarks !== void 0 && current2.length >= maxMarks) {
        setSaid(`No more than ${maxMarks} marks.`);
        return;
      }
      const mark = { ...shape, id: newMarkId(), n: current2.length + 1 };
      if (live.current.tone === "danger") mark.tone = "danger";
      commit([...current2, mark], `${KIND_LABEL[mark.kind]} ${mark.n} added`);
      select(mark.id);
      if (noteOnCreate) setEditing(mark.id);
    },
    [commit, maxMarks, noteOnCreate, select]
  );
  const removeMark = useCallback6(
    (id) => {
      const current2 = live.current.marks;
      const gone = current2.find((m) => m.id === id);
      if (!gone) return;
      commit(renumberMarks(current2.filter((m) => m.id !== id)), `${KIND_LABEL[gone.kind]} ${gone.n} removed`);
      select(void 0);
      setEditing(null);
      boxRef.current?.focus();
    },
    [boxRef, commit, select]
  );
  const replaceMark = useCallback6(
    (next) => {
      commit(live.current.marks.map((m) => m.id === next.id ? next : m));
    },
    [commit]
  );
  useEffect14(() => {
    if (!gesture) return;
    const onMove = (e) => {
      const p = toPoint(e.clientX, e.clientY);
      if (!p) return;
      if (gesture.type === "draw") {
        const base2 = { id: "draft", n: live.current.marks.length + 1, tone: live.current.tone };
        if (gesture.kind === "box") {
          setDraft({ ...base2, kind: "box", rect: rectFromCorners(gesture.start, p) });
        } else if (gesture.kind === "arrow") {
          setDraft({ ...base2, kind: "arrow", points: [gesture.start, p] });
        } else {
          stroke.current.push(p);
          setDraft({
            ...base2,
            kind: gesture.kind,
            points: stroke.current.slice(),
            width: gesture.kind === "brush" ? live.current.brushWidth : void 0
          });
        }
      } else if (gesture.type === "move") {
        setDraft(moveMark(gesture.origin, p[0] - gesture.start[0], p[1] - gesture.start[1]));
      } else {
        setDraft(dragHandle(gesture.origin, gesture.handle, p));
      }
    };
    const onUp = () => {
      const d = live.current.draft;
      setGesture(null);
      setDraft(null);
      if (!d) return;
      if (gesture.type !== "draw") {
        replaceMark(d);
        return;
      }
      const { id: _id, n: _n, tone: _tone, ...shape } = d;
      if (d.kind === "box" && d.rect && (d.rect[2] < MIN_BOX || d.rect[3] < MIN_BOX)) return;
      if (d.kind === "arrow" && d.points && distance(d.points[0], d.points[1]) < MIN_ARROW) return;
      if ((d.kind === "freehand" || d.kind === "brush") && d.points) {
        shape.points = simplifyPath(d.points, SIMPLIFY);
      }
      addMark(shape);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [gesture, toPoint, addMark, replaceMark]);
  const onPointerDown = (e) => {
    if (readOnly || e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("[data-rm-mark-control]")) return;
    const p = toPoint(e.clientX, e.clientY);
    if (!p) return;
    setEditing(null);
    if (tool === "select") {
      const { w, h } = screenSize();
      const current2 = marks.find((m) => m.id === selected);
      if (current2) {
        const grabbed = handlesOf(current2).find((hd) => distance([hd.at[0] * w, hd.at[1] * h], [p[0] * w, p[1] * h]) <= HIT_HANDLE);
        if (grabbed) {
          e.preventDefault();
          setGesture({ type: "handle", id: current2.id, handle: grabbed.id, origin: current2 });
          return;
        }
      }
      const hit = hitTestMarks(marks, p, w, h);
      select(hit?.id);
      if (hit) {
        e.preventDefault();
        setGesture({ type: "move", id: hit.id, start: p, origin: hit });
      }
      return;
    }
    if (full) {
      setSaid(`No more than ${maxMarks} marks.`);
      return;
    }
    e.preventDefault();
    if (tool === "pin") {
      addMark({ kind: "pin", at: p });
      return;
    }
    stroke.current = [p];
    setGesture({ type: "draw", kind: tool, start: p });
    if (tool === "freehand" || tool === "brush") {
      setDraft({
        id: "draft",
        n: marks.length + 1,
        kind: tool,
        points: [p],
        width: tool === "brush" ? brushWidth : void 0,
        tone
      });
    }
  };
  const cancelGesture = () => {
    setGesture(null);
    setDraft(null);
    stroke.current = [];
  };
  const onBoxKeyDown = (e) => {
    if (readOnly) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) onRedo?.();
      else onUndo?.();
      return;
    }
    if (mod && e.key.toLowerCase() === "y") {
      e.preventDefault();
      onRedo?.();
      return;
    }
    if (e.key === "Escape" && gesture) {
      e.preventDefault();
      e.stopPropagation();
      cancelGesture();
      return;
    }
    if (e.key === "Enter" && e.target === e.currentTarget && tool !== "select") {
      e.preventDefault();
      addMark(centreMark(tool, brushWidth));
    }
  };
  const onBadgeKeyDown = (m) => (e) => {
    if (readOnly) return;
    const step = e.shiftKey ? NUDGE * 10 : NUDGE;
    const delta = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const d = delta[e.key];
    if (d) {
      e.preventDefault();
      e.stopPropagation();
      replaceMark(e.altKey ? resizeMark(m, d[0], d[1]) : moveMark(m, d[0], d[1]));
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      e.stopPropagation();
      removeMark(m.id);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      setEditing(m.id);
    }
  };
  useImperativeHandle(
    ref,
    () => ({
      naturalSize: () => ({
        width: imgRef.current?.naturalWidth ?? 0,
        height: imgRef.current?.naturalHeight ?? 0
      }),
      exportAnnotated: async (opts = {}) => {
        if (!url) throw new Error("There is no picture to export yet.");
        const loaded = await loadForCanvas(url);
        try {
          const { width, height } = fitWithin(loaded.width, loaded.height, opts.maxSize ?? 2048);
          const canvas = makeCanvas(width, height);
          const ctx = context2d(canvas);
          paintAnnotated(ctx, loaded.image, live.current.marks, width, height, { hideNumbers: opts.hideNumbers });
          return await canvasBlob(canvas, opts.type ?? "image/png");
        } finally {
          loaded.release();
        }
      },
      exportMask: async (opts = {}) => {
        let width = imgRef.current?.naturalWidth ?? 0;
        let height = imgRef.current?.naturalHeight ?? 0;
        if (!width || !height) throw new Error("The picture has not loaded, so its mask has no size yet.");
        if (opts.maxSize) ({ width, height } = fitWithin(width, height, opts.maxSize));
        const canvas = makeCanvas(width, height);
        paintMask(context2d(canvas), () => context2d(makeCanvas(width, height)), live.current.marks, width, height, opts);
        return canvasBlob(canvas, "image/png");
      }
    }),
    [url]
  );
  const shown = draft && draft.id !== "draft" ? marks.map((m) => m.id === draft.id ? draft : m) : marks;
  const drawing = draft && draft.id === "draft" ? draft : null;
  const current = shown.find((m) => m.id === selected);
  const unavailable = broken || failed || !url && !resolving;
  return /* @__PURE__ */ jsxs37("div", { className: cn("flex flex-col gap-2 text-left", className), "data-rm-image-markup": "", children: [
    onToolChange && !readOnly && /* @__PURE__ */ jsxs37("div", { role: "toolbar", "aria-label": "Markup tools", className: cn("flex flex-wrap items-center gap-1 border p-1", tk.radius, tk.border, tk.bgCard), children: [
      tools.map((t) => /* @__PURE__ */ jsx41(
        ToolButton,
        {
          icon: TOOL_META[t].icon,
          label: TOOL_META[t].label,
          pressed: tool === t,
          onClick: () => onToolChange(t)
        },
        t
      )),
      /* @__PURE__ */ jsx41("span", { "aria-hidden": "true", className: cn("mx-1 h-5 w-px", tk.bgBorder) }),
      /* @__PURE__ */ jsx41(
        ToolButton,
        {
          icon: "plus",
          label: tool === "select" ? "Pick a tool to add a mark" : `Add ${TOOL_META[tool].label.toLowerCase()} at the centre`,
          disabled: tool === "select" || full,
          onClick: () => tool !== "select" && addMark(centreMark(tool, brushWidth))
        }
      ),
      /* @__PURE__ */ jsx41(ToolButton, { icon: "trash-2", label: "Remove the selected mark", disabled: !selected, onClick: () => selected && removeMark(selected) }),
      (onUndo || onRedo) && /* @__PURE__ */ jsxs37(Fragment12, { children: [
        /* @__PURE__ */ jsx41("span", { "aria-hidden": "true", className: cn("mx-1 h-5 w-px", tk.bgBorder) }),
        /* @__PURE__ */ jsx41(ToolButton, { icon: "undo-2", label: "Undo", disabled: canUndo === false || !onUndo, onClick: () => onUndo?.() }),
        /* @__PURE__ */ jsx41(ToolButton, { icon: "redo-2", label: "Redo", disabled: canRedo === false || !onRedo, onClick: () => onRedo?.() })
      ] })
    ] }),
    /* @__PURE__ */ jsxs37(
      "div",
      {
        ref: boxRef,
        role: "group",
        "aria-label": alt ? `Marks on ${alt}` : "Marks on the picture",
        "aria-describedby": void 0,
        tabIndex: readOnly ? void 0 : 0,
        "data-rm-markup-canvas": "",
        "data-tool": tool,
        onPointerDown,
        onKeyDown: onBoxKeyDown,
        className: cn(
          "relative inline-block max-w-full select-none self-start overflow-hidden leading-none",
          tk.radiusMd,
          tk.bgMuted,
          !readOnly && "touch-none",
          !readOnly && (tool === "select" ? gesture ? "cursor-grabbing" : "cursor-default" : "cursor-crosshair"),
          !readOnly && focusRing
        ),
        children: [
          unavailable ? /* @__PURE__ */ jsx41(
            "span",
            {
              role: "img",
              "aria-label": alt ? `${alt} (picture unavailable)` : "Picture unavailable",
              className: cn("flex h-48 w-72 max-w-full items-center justify-center", tk.fgFaint),
              children: /* @__PURE__ */ jsx41(Icon, { name: "image-off", size: 24, strokeWidth: 1.5 })
            }
          ) : !url ? /* @__PURE__ */ jsx41(Skeleton, { variant: "rect", className: "h-48 w-72 max-w-full rounded-none" }) : /* @__PURE__ */ jsx41(
            "img",
            {
              ref: imgRef,
              src: url,
              alt,
              draggable: false,
              onError: () => {
                if (fromFile && !retried.current) {
                  retried.current = true;
                  refresh();
                } else setBroken(true);
              },
              style: { maxHeight },
              className: "block h-auto w-auto max-w-full"
            }
          ),
          !unavailable && url && /* @__PURE__ */ jsxs37(
            "svg",
            {
              "aria-hidden": "true",
              viewBox: `0 0 ${vw} ${vh}`,
              preserveAspectRatio: "none",
              className: "pointer-events-none absolute inset-0 h-full w-full",
              children: [
                shown.map((m) => /* @__PURE__ */ jsx41(MarkShape, { mark: m, vw, vh, selected: m.id === selected }, m.id)),
                drawing && /* @__PURE__ */ jsx41(MarkShape, { mark: drawing, vw, vh, selected: false }),
                current && !readOnly && tool === "select" && handlesOf(current).map((hd) => /* @__PURE__ */ jsx41(
                  "circle",
                  {
                    cx: hd.at[0] * vw,
                    cy: hd.at[1] * vh,
                    r: 5,
                    style: { fill: HALO, stroke: TONE_STROKE[current.tone ?? "default"], strokeWidth: 2 }
                  },
                  hd.id
                ))
              ]
            }
          ),
          !unavailable && url && shown.map((m) => {
            const [ax, ay] = markAnchor(m);
            const isSelected = m.id === selected;
            return /* @__PURE__ */ jsx41(
              "button",
              {
                ref: (el) => {
                  badges.current.set(m.id, el);
                },
                type: "button",
                "data-rm-mark": m.id,
                "data-rm-mark-control": "",
                "aria-label": `${KIND_LABEL[m.kind]} ${m.n}${m.note ? `: ${m.note}` : ""}`,
                "aria-pressed": isSelected,
                tabIndex: readOnly ? -1 : 0,
                onFocus: () => select(m.id),
                onClick: () => select(m.id),
                onDoubleClick: () => !readOnly && setEditing(m.id),
                onKeyDown: onBadgeKeyDown(m),
                style: { left: `${ax * 100}%`, top: `${ay * 100}%` },
                className: cn(
                  "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-semibold leading-none tabular-nums ring-2 ring-[color:oklch(1_0_0/0.9)] transition-transform",
                  numbered ? "h-6 min-w-[1.5rem] px-1" : "h-3.5 w-3.5",
                  BADGE_TONE[m.tone ?? "default"],
                  tk.shadowMd,
                  isSelected && "scale-125",
                  focusRing
                ),
                children: numbered ? m.n : null
              },
              m.id
            );
          }),
          editing && (() => {
            const m = shown.find((x) => x.id === editing);
            if (!m) return null;
            const [ax, ay] = markAnchor(m);
            return /* @__PURE__ */ jsx41(
              NoteBox,
              {
                label: `Note for ${KIND_LABEL[m.kind].toLowerCase()} ${m.n}`,
                initial: m.note ?? "",
                x: ax,
                y: ay,
                onDone: (text) => {
                  setEditing(null);
                  if (text !== void 0 && text !== (m.note ?? "")) replaceMark({ ...m, note: text || void 0 });
                  badges.current.get(m.id)?.focus();
                }
              },
              m.id
            );
          })()
        ]
      }
    ),
    /* @__PURE__ */ jsx41("span", { "aria-live": "polite", className: "sr-only", children: said })
  ] });
});
function MarkShape({ mark, vw, vh, selected }) {
  const t = mark.tone ?? "default";
  const colour = TONE_STROKE[t];
  const weight = selected ? 3 : 2;
  const line = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  const px = (p) => `${p[0] * vw},${p[1] * vh}`;
  if (mark.kind === "box" && mark.rect) {
    const [x, y, w, h] = mark.rect;
    const box = { x: x * vw, y: y * vh, width: w * vw, height: h * vh, rx: 3 };
    return /* @__PURE__ */ jsxs37("g", { "data-rm-mark-shape": mark.id, children: [
      /* @__PURE__ */ jsx41("rect", { ...box, style: { ...line, stroke: HALO, strokeWidth: weight + 3 } }),
      /* @__PURE__ */ jsx41("rect", { ...box, style: { ...line, fill: TONE_WASH[t], stroke: colour, strokeWidth: weight } })
    ] });
  }
  if (mark.kind === "arrow" && mark.points && mark.points.length === 2) {
    const from = [mark.points[0][0] * vw, mark.points[0][1] * vh];
    const to = [mark.points[1][0] * vw, mark.points[1][1] * vh];
    const head = arrowHead(from, to, ARROW_HEAD).map((p) => `${p[0]},${p[1]}`).join(" ");
    return /* @__PURE__ */ jsxs37("g", { "data-rm-mark-shape": mark.id, children: [
      /* @__PURE__ */ jsx41("line", { x1: from[0], y1: from[1], x2: to[0], y2: to[1], style: { ...line, stroke: HALO, strokeWidth: weight + 3 } }),
      /* @__PURE__ */ jsx41("polygon", { points: head, style: { fill: HALO, stroke: HALO, strokeWidth: 3, strokeLinejoin: "round" } }),
      /* @__PURE__ */ jsx41("line", { x1: from[0], y1: from[1], x2: to[0], y2: to[1], style: { ...line, stroke: colour, strokeWidth: weight } }),
      /* @__PURE__ */ jsx41("polygon", { points: head, style: { fill: colour } })
    ] });
  }
  if ((mark.kind === "freehand" || mark.kind === "brush") && mark.points && mark.points.length > 0) {
    const pts = mark.points.length === 1 ? [mark.points[0], mark.points[0]] : mark.points;
    const d = pts.map(px).join(" ");
    if (mark.kind === "brush") {
      const wide = Math.max(4, (mark.width ?? 0.06) * vw);
      return /* @__PURE__ */ jsxs37("g", { "data-rm-mark-shape": mark.id, children: [
        /* @__PURE__ */ jsx41("polyline", { points: d, style: { ...line, stroke: TONE_PAINT[t], strokeWidth: wide } }),
        selected && /* @__PURE__ */ jsx41("polyline", { points: d, style: { ...line, stroke: colour, strokeWidth: 1.5, strokeDasharray: "4 4" } })
      ] });
    }
    return /* @__PURE__ */ jsxs37("g", { "data-rm-mark-shape": mark.id, children: [
      /* @__PURE__ */ jsx41("polyline", { points: d, style: { ...line, stroke: HALO, strokeWidth: weight + 3 } }),
      /* @__PURE__ */ jsx41("polyline", { points: d, style: { ...line, stroke: colour, strokeWidth: weight } })
    ] });
  }
  return null;
}
function ToolButton({
  icon,
  label,
  pressed,
  disabled,
  onClick
}) {
  return /* @__PURE__ */ jsx41(
    "button",
    {
      type: "button",
      "aria-label": label,
      title: label,
      "aria-pressed": pressed,
      disabled,
      onClick,
      className: cn(
        "inline-flex h-8 w-8 items-center justify-center",
        ghostControl,
        pressed && cn(tk.bgPrimarySoft, tk.fgPrimary),
        focusRing
      ),
      children: /* @__PURE__ */ jsx41(Icon, { name: icon, size: 16 })
    }
  );
}
function NoteBox({
  label,
  initial,
  x,
  y,
  onDone
}) {
  const [text, setText] = useState21(initial);
  const inputRef = useRef14(null);
  const done = useRef14(false);
  useEffect14(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);
  const finish = (value) => {
    if (done.current) return;
    done.current = true;
    onDone(value);
  };
  return /* @__PURE__ */ jsx41(
    "div",
    {
      "data-rm-mark-control": "",
      style: {
        left: x > 0.6 ? void 0 : `calc(${x * 100}% + 1rem)`,
        right: x > 0.6 ? `calc(${(1 - x) * 100}% + 1rem)` : void 0,
        top: y > 0.8 ? void 0 : `calc(${y * 100}% - 1rem)`,
        bottom: y > 0.8 ? `calc(${(1 - y) * 100}% - 1rem)` : void 0
      },
      className: "absolute z-10 w-56 max-w-[70%]",
      children: /* @__PURE__ */ jsx41(
        "input",
        {
          ref: inputRef,
          value: text,
          "aria-label": label,
          placeholder: "Say what this is about",
          onChange: (e) => setText(e.target.value),
          onBlur: () => finish(text.trim()),
          onKeyDown: (e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              finish(text.trim());
            } else if (e.key === "Escape") {
              e.preventDefault();
              finish(void 0);
            }
          },
          className: cn(inputBase, tk.shadowLg, "leading-normal")
        }
      )
    }
  );
}
function MarkList({
  marks,
  onMarksChange,
  selectedId,
  onSelect,
  readOnly = false,
  notePlaceholder = "Say what this is about",
  emptyState = "Nothing marked yet.",
  className
}) {
  if (marks.length === 0) {
    return /* @__PURE__ */ jsx41("div", { className: cn("py-4 text-left", textStyles.muted, className), children: emptyState });
  }
  const swap = (i, j) => {
    const next = marks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onMarksChange(renumberMarks(next));
  };
  return /* @__PURE__ */ jsx41("ol", { "data-rm-mark-list": "", className: cn("flex flex-col gap-1 text-left", className), children: marks.map((m, i) => {
    const isSelected = m.id === selectedId;
    return /* @__PURE__ */ jsxs37(
      "li",
      {
        "data-rm-mark-row": m.id,
        "aria-current": isSelected || void 0,
        onClick: () => onSelect?.(m.id),
        className: cn(
          "flex items-center gap-2 border px-2 py-1.5",
          tk.radiusMd,
          isSelected ? cn(tk.borderPrimary, tk.selectedBgPrimarySoft) : cn("border-transparent", tk.hoverBgMutedHalf)
        ),
        children: [
          /* @__PURE__ */ jsx41(
            "span",
            {
              "aria-hidden": "true",
              className: cn(
                "flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums",
                BADGE_TONE[m.tone ?? "default"]
              ),
              children: m.n
            }
          ),
          /* @__PURE__ */ jsx41(Icon, { name: TOOL_META[m.kind].icon, size: 14, className: cn("shrink-0", tk.fgMuted), label: KIND_LABEL[m.kind] }),
          readOnly ? /* @__PURE__ */ jsx41("span", { className: cn("min-w-0 flex-1 text-sm", m.note ? tk.fg : tk.fgMuted), children: m.note || "No note" }) : /* @__PURE__ */ jsx41(
            "input",
            {
              value: m.note ?? "",
              placeholder: notePlaceholder,
              "aria-label": `Note for ${KIND_LABEL[m.kind].toLowerCase()} ${m.n}`,
              onFocus: () => onSelect?.(m.id),
              onChange: (e) => onMarksChange(marks.map((x) => x.id === m.id ? { ...x, note: e.target.value || void 0 } : x)),
              className: cn(inputBase, "min-w-0 flex-1 py-1 shadow-none")
            }
          ),
          !readOnly && /* @__PURE__ */ jsxs37("span", { className: "flex shrink-0 items-center", children: [
            /* @__PURE__ */ jsx41(RowButton, { icon: "arrow-up", label: `Move mark ${m.n} up`, disabled: i === 0, onClick: () => swap(i, i - 1) }),
            /* @__PURE__ */ jsx41(
              RowButton,
              {
                icon: "arrow-down",
                label: `Move mark ${m.n} down`,
                disabled: i === marks.length - 1,
                onClick: () => swap(i, i + 1)
              }
            ),
            /* @__PURE__ */ jsx41(
              RowButton,
              {
                icon: "trash-2",
                label: `Remove mark ${m.n}`,
                onClick: () => {
                  onMarksChange(renumberMarks(marks.filter((x) => x.id !== m.id)));
                  if (isSelected) onSelect?.(void 0);
                }
              }
            )
          ] })
        ]
      },
      m.id
    );
  }) });
}
function RowButton({
  icon,
  label,
  disabled,
  onClick
}) {
  return /* @__PURE__ */ jsx41(
    "button",
    {
      type: "button",
      "aria-label": label,
      title: label,
      disabled,
      onClick: (e) => {
        e.stopPropagation();
        onClick();
      },
      className: cn("inline-flex h-7 w-7 items-center justify-center", ghostControl, focusRing),
      children: /* @__PURE__ */ jsx41(Icon, { name: icon, size: 14 })
    }
  );
}
function noteEditOf(a, b) {
  if (a.length !== b.length) return null;
  let edited = null;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (a[i].id !== b[i].id) return null;
    const { note: noteA, ...restA } = a[i];
    const { note: noteB, ...restB } = b[i];
    if (JSON.stringify(restA) !== JSON.stringify(restB)) return null;
    if ((noteA ?? "") === (noteB ?? "")) continue;
    if (edited) return null;
    edited = a[i].id;
  }
  return edited;
}
function useMarkHistory(initial = [], limit = 100) {
  const [state, setState] = useState21({ past: [], present: initial, future: [] });
  const latest = useRef14(state);
  const typing = useRef14(null);
  const apply = useCallback6((next) => {
    latest.current = next;
    setState(next);
  }, []);
  const setMarks = useCallback6(
    (next) => {
      const s = latest.current;
      if (next === s.present) return;
      const edited = noteEditOf(s.present, next);
      const now = Date.now();
      const same = edited !== null && typing.current?.id === edited && now - typing.current.at < 1500;
      typing.current = edited !== null ? { id: edited, at: now } : null;
      apply(
        same ? { ...s, present: next, future: [] } : { past: [...s.past, s.present].slice(-limit), present: next, future: [] }
      );
    },
    [apply, limit]
  );
  const undo = useCallback6(() => {
    typing.current = null;
    const s = latest.current;
    if (s.past.length === 0) return;
    apply({ past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] });
  }, [apply]);
  const redo = useCallback6(() => {
    typing.current = null;
    const s = latest.current;
    if (s.future.length === 0) return;
    apply({ past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) });
  }, [apply]);
  const reset = useCallback6(
    (marks = []) => {
      typing.current = null;
      apply({ past: [], present: marks, future: [] });
    },
    [apply]
  );
  return {
    marks: state.present,
    setMarks,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    reset
  };
}
function tracePath(ctx, pts, w, h) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x * w, y * h) : ctx.lineTo(x * w, y * h));
  if (pts.length === 1) ctx.lineTo(pts[0][0] * w, pts[0][1] * h);
}
function paintAnnotated(ctx, image, marks, w, h, opts = {}) {
  if (image) ctx.drawImage(image, 0, 0, w, h);
  const unit = Math.max(w, h);
  const weight = Math.max(3, Math.round(unit / 260));
  const halo = weight + Math.max(2, Math.round(weight * 0.8));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const strokeTwice = (trace) => {
    trace();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = halo;
    ctx.stroke();
    trace();
    ctx.strokeStyle = MARK_EXPORT_COLOR;
    ctx.lineWidth = weight;
    ctx.stroke();
  };
  for (const m of marks) {
    if (m.kind === "brush" && m.points && m.points.length > 0) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = MARK_EXPORT_COLOR;
      ctx.lineWidth = Math.max(weight, (m.width ?? 0.06) * w);
      tracePath(ctx, m.points, w, h);
      ctx.stroke();
      ctx.restore();
    } else if (m.kind === "freehand" && m.points && m.points.length > 0) {
      const pts = m.points;
      strokeTwice(() => tracePath(ctx, pts, w, h));
    } else if (m.kind === "box" && m.rect) {
      const [x, y, rw, rh] = m.rect;
      strokeTwice(() => {
        ctx.beginPath();
        ctx.rect(x * w, y * h, rw * w, rh * h);
      });
    } else if (m.kind === "arrow" && m.points && m.points.length === 2) {
      const from = [m.points[0][0] * w, m.points[0][1] * h];
      const to = [m.points[1][0] * w, m.points[1][1] * h];
      strokeTwice(() => {
        ctx.beginPath();
        ctx.moveTo(from[0], from[1]);
        ctx.lineTo(to[0], to[1]);
      });
      const head = arrowHead(from, to, weight * 5);
      const traceHead = () => {
        ctx.beginPath();
        ctx.moveTo(head[0][0], head[0][1]);
        ctx.lineTo(head[1][0], head[1][1]);
        ctx.lineTo(head[2][0], head[2][1]);
        ctx.closePath();
      };
      traceHead();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = halo - weight;
      ctx.stroke();
      ctx.fillStyle = MARK_EXPORT_COLOR;
      ctx.fill();
    }
  }
  const r = Math.max(11, Math.round(unit / 64));
  for (const m of marks) {
    const [ax, ay] = markAnchor(m);
    const cx2 = clampTo(ax * w, r, w - r);
    const cy = clampTo(ay * h, r, h - r);
    if (opts.hideNumbers && m.kind !== "pin") continue;
    ctx.beginPath();
    ctx.arc(cx2, cy, opts.hideNumbers ? r * 0.55 : r, 0, Math.PI * 2);
    ctx.fillStyle = MARK_EXPORT_COLOR;
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(2, Math.round(r / 5));
    ctx.stroke();
    if (opts.hideNumbers) continue;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${Math.round(r * 1.15)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(m.n), cx2, cy + r * 0.06);
  }
}
function paintMask(ctx, scratch, marks, w, h, opts = {}) {
  const kinds = opts.kinds ?? ["brush", "box"];
  const dilate = Math.max(0, opts.dilate ?? 0);
  const feather = Math.max(0, opts.feather ?? 0);
  const regions = scratch();
  regions.clearRect(0, 0, w, h);
  regions.fillStyle = "#000000";
  regions.strokeStyle = "#000000";
  regions.lineCap = "round";
  regions.lineJoin = "round";
  for (const m of marks) {
    if (!kinds.includes(m.kind)) continue;
    if (m.kind === "brush" && m.points && m.points.length > 0) {
      regions.lineWidth = Math.max(1, (m.width ?? 0.06) * w) + dilate * 2;
      tracePath(regions, m.points, w, h);
      regions.stroke();
    } else if (m.kind === "box" && m.rect) {
      const [x, y, rw, rh] = m.rect;
      regions.fillRect(x * w - dilate, y * h - dilate, rw * w + dilate * 2, rh * h + dilate * 2);
    } else if (m.kind === "freehand" && m.points && m.points.length > 2) {
      tracePath(regions, m.points, w, h);
      regions.closePath();
      regions.fill();
      if (dilate > 0) {
        regions.lineWidth = dilate * 2;
        regions.stroke();
      }
    } else if (m.kind === "pin" && m.at) {
      regions.beginPath();
      regions.arc(m.at[0] * w, m.at[1] * h, Math.max(w, h) * 0.04 + dilate, 0, Math.PI * 2);
      regions.fill();
    } else if (m.kind === "arrow" && m.points && m.points.length === 2) {
      regions.lineWidth = Math.max(w, h) * 0.02 + dilate * 2;
      tracePath(regions, m.points, w, h);
      regions.stroke();
    }
  }
  ctx.clearRect(0, 0, w, h);
  if (!opts.invert) {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "destination-out";
  }
  if (feather > 0 && "filter" in ctx) ctx.filter = `blur(${feather}px)`;
  ctx.drawImage(regions.canvas, 0, 0, w, h);
  if ("filter" in ctx) ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
}
function fitWithin(width, height, maxSize) {
  const longest = Math.max(width, height);
  if (!maxSize || longest <= maxSize) return { width, height };
  const k = maxSize / longest;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}
function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
function context2d(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot draw to a canvas, so the picture cannot be exported.");
  return ctx;
}
function canvasBlob(canvas, type) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("The picture could not be encoded.")),
        type,
        type === "image/jpeg" ? 0.92 : void 0
      );
    } catch {
      reject(new Error(TAINTED));
    }
  });
}
var TAINTED = "The picture's server does not let this page read it back, so it cannot be exported. Show it from a file the robot saved, or from a data URL.";
function loadElement(url, crossOrigin) {
  return new Promise((resolve, reject) => {
    const el = document.createElement("img");
    if (crossOrigin) el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("The picture could not be loaded for export."));
    el.src = url;
  });
}
async function loadForCanvas(url) {
  const local = url.startsWith("data:") || url.startsWith("blob:");
  try {
    const image = await loadElement(url, !local);
    return { image, width: image.naturalWidth, height: image.naturalHeight, release: () => void 0 };
  } catch {
    if (local) throw new Error("The picture could not be loaded for export.");
  }
  let objectUrl2;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(String(res.status));
    objectUrl2 = URL.createObjectURL(await res.blob());
    const image = await loadElement(objectUrl2, false);
    const held = objectUrl2;
    return { image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(held) };
  } catch {
    if (objectUrl2) URL.revokeObjectURL(objectUrl2);
    throw new Error(TAINTED);
  }
}

// src/components/thread.tsx
import {
  useCallback as useCallback7,
  useEffect as useEffect15,
  useRef as useRef15,
  useState as useState22
} from "react";
import { useFileUpload } from "@robomotion/apps-runtime/react";

// src/components/empty-state.tsx
import { jsx as jsx42, jsxs as jsxs38 } from "react/jsx-runtime";
function EmptyState({ icon = "inbox", title, description, action, className, ...props }) {
  return /* @__PURE__ */ jsxs38(
    "div",
    {
      className: cn(
        "flex flex-col items-center justify-center gap-2 border border-dashed px-6 py-12 text-center",
        tk.radius,
        tk.borderInput,
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx42(
          "div",
          {
            "aria-hidden": "true",
            className: cn("mb-2 flex h-12 w-12 items-center justify-center rounded-full", tk.bgMuted, tk.fgMuted),
            children: renderIcon(icon, 24)
          }
        ),
        /* @__PURE__ */ jsx42("h3", { className: textStyles.cardTitle, children: title }),
        description !== void 0 && /* @__PURE__ */ jsx42("p", { className: cn("max-w-sm", textStyles.muted), children: description }),
        action !== void 0 && /* @__PURE__ */ jsx42("div", { className: "mt-3", children: action })
      ]
    }
  );
}

// src/components/markdown.tsx
import { jsx as jsx43 } from "react/jsx-runtime";
var prose = cn(
  "text-sm leading-relaxed",
  tk.fg,
  "[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-semibold [&_h1:first-child]:mt-0",
  "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2:first-child]:mt-0",
  "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3:first-child]:mt-0",
  "[&_h1]:text-[color:oklch(var(--rm-foreground))] [&_h2]:text-[color:oklch(var(--rm-foreground))] [&_h3]:text-[color:oklch(var(--rm-foreground))]",
  "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1",
  "[&_a]:text-[color:oklch(var(--rm-primary))] [&_a]:underline [&_a]:underline-offset-2",
  "[&_strong]:font-semibold [&_em]:italic",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[color:oklch(var(--rm-border))] [&_blockquote]:pl-3 [&_blockquote]:text-[color:oklch(var(--rm-muted-foreground))]",
  "[&_code]:rounded-[calc(var(--rm-radius)_-_0.25rem)] [&_code]:bg-[color:oklch(var(--rm-muted))] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-[calc(var(--rm-radius)_-_0.125rem)] [&_pre]:bg-[color:oklch(var(--rm-muted))] [&_pre]:p-3",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left",
  "[&_th]:border-b [&_th]:border-[color:oklch(var(--rm-border))] [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold",
  "[&_td]:border-b [&_td]:border-[color:oklch(var(--rm-border))] [&_td]:px-2 [&_td]:py-1",
  "[&_hr]:my-4 [&_hr]:border-[color:oklch(var(--rm-border))]"
);
function Markdown({ children, streaming = false, className }) {
  return /* @__PURE__ */ jsx43("div", { className: cn(prose, "text-left", className), children: /* @__PURE__ */ jsx43(Xa, { mode: "streaming", isAnimating: streaming, children: children ?? "" }) });
}

// src/components/thread.tsx
import { Fragment as Fragment13, jsx as jsx44, jsxs as jsxs39 } from "react/jsx-runtime";
function Thread({
  messages,
  onSend,
  action,
  params,
  attachments,
  controls,
  placeholder,
  busy,
  emptyState = "Nothing here yet.",
  height = 360,
  readOnly = false,
  sendLabel,
  className
}) {
  const listRef = useRef15(null);
  const count = messages.length;
  const lastBody = messages[count - 1]?.body;
  useEffect15(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count, lastBody]);
  return /* @__PURE__ */ jsxs39("div", { className: cn("flex flex-col text-left", className), children: [
    /* @__PURE__ */ jsx44(
      "div",
      {
        ref: listRef,
        role: "log",
        "aria-live": "polite",
        "aria-label": "Conversation",
        style: { maxHeight: height },
        className: "flex-1 space-y-3 overflow-y-auto pr-1",
        children: count === 0 ? (
          // A string is the title of the kit's own empty state; an element is
          // a screen's own design and goes in as it is.
          typeof emptyState === "string" ? /* @__PURE__ */ jsx44(EmptyState, { icon: "message-square", title: emptyState, className: "py-8" }) : emptyState
        ) : messages.map((m, i) => /* @__PURE__ */ jsx44(Message, { message: m }, m.id ?? i))
      }
    ),
    !readOnly && /* @__PURE__ */ jsx44(
      Composer,
      {
        className: "mt-3",
        onSend,
        action,
        params,
        attachments,
        controls,
        placeholder,
        busy,
        sendLabel
      }
    )
  ] });
}
function Message({ message, className }) {
  const { author, avatarUrl, at, body, own, streaming } = message;
  return /* @__PURE__ */ jsxs39("div", { className: cn("flex items-start gap-2.5", own && "flex-row-reverse", className), children: [
    /* @__PURE__ */ jsx44(Avatar, { size: "sm", name: author, src: avatarUrl, className: "mt-0.5" }),
    /* @__PURE__ */ jsxs39("div", { className: cn("min-w-0 max-w-[85%]", own && "text-right"), children: [
      /* @__PURE__ */ jsxs39("div", { className: cn("flex items-baseline gap-2 text-xs", tk.fgMuted, own && "flex-row-reverse"), children: [
        /* @__PURE__ */ jsx44("span", { className: cn("font-medium", tk.fg), children: author ?? "The robot" }),
        at !== void 0 && /* @__PURE__ */ jsx44("span", { children: formatAt2(at) })
      ] }),
      /* @__PURE__ */ jsx44(
        "div",
        {
          className: cn(
            "mt-1 inline-block px-3 py-2 text-left",
            tk.radius,
            own ? cn(tk.bgPrimary, tk.fgOnPrimary) : cn(tk.bgMuted, tk.fg)
          ),
          children: /* @__PURE__ */ jsx44(Markdown, { streaming, className: own ? tk.fgOnPrimary : void 0, children: body })
        }
      )
    ] })
  ] });
}
function Composer(props) {
  if (props.attachments) {
    const config = props.attachments === true ? {} : props.attachments;
    return /* @__PURE__ */ jsx44(AttachmentTray, { accept: config.accept, max: config.max ?? 8, children: (tray) => /* @__PURE__ */ jsx44(ComposerBox, { ...props, tray }) });
  }
  return /* @__PURE__ */ jsx44(ComposerBox, { ...props, tray: null });
}
function ComposerBox({
  onSend,
  action,
  params,
  placeholder = "Write a message",
  busy,
  disabled,
  sendLabel = "Send",
  controls,
  className,
  tray
}) {
  const [text, setText] = useState22("");
  const working = busy ?? action?.loading ?? false;
  const uploading = tray?.uploading ?? false;
  const files = tray?.ready ?? NO_FILES;
  const empty = text.trim() === "" && files.length === 0;
  const send = () => {
    const body = text.trim();
    if (empty || working || disabled || uploading) return;
    setText("");
    if (!tray) {
      onSend?.(body);
      if (action) void runAction(action, params ? params(body) : { text: body }).catch(() => void 0);
      return;
    }
    tray.clear();
    onSend?.(body, files);
    if (action) {
      void runAction(action, params ? params(body, files) : { text: body, files }).catch(() => void 0);
    }
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };
  const row = /* @__PURE__ */ jsxs39("div", { className: cn("flex items-end gap-2", !tray && className), children: [
    tray && /* @__PURE__ */ jsx44(
      "button",
      {
        type: "button",
        "aria-label": "Attach a file",
        title: "Attach a file",
        disabled: disabled || tray.full,
        onClick: tray.browse,
        className: cn("flex h-[38px] w-9 shrink-0 items-center justify-center", ghostControl, focusRing),
        children: /* @__PURE__ */ jsx44(Icon, { name: "paperclip", size: 18 })
      }
    ),
    /* @__PURE__ */ jsx44(
      "textarea",
      {
        rows: 1,
        value: text,
        placeholder,
        disabled,
        onChange: (e) => setText(e.target.value),
        onKeyDown,
        onPaste: tray?.onPaste,
        onDrop: tray?.onDrop,
        onDragOver: tray?.onDragOver,
        "aria-label": placeholder,
        className: cn(inputBase, "max-h-40 min-h-[38px] resize-y py-2", focusRing)
      }
    ),
    controls !== void 0 && /* @__PURE__ */ jsx44("div", { "data-rm-composer-controls": "", className: "flex shrink-0 items-center gap-2", children: controls }),
    /* @__PURE__ */ jsx44(
      Button,
      {
        onClick: send,
        loading: working,
        disabled: disabled || empty || uploading,
        icon: "send",
        "data-rm-action": action?.name,
        children: sendLabel
      }
    )
  ] });
  if (!tray) return row;
  return /* @__PURE__ */ jsxs39("div", { className: cn("flex flex-col gap-2", className), children: [
    tray.list,
    row,
    tray.problem && /* @__PURE__ */ jsx44("p", { role: "alert", className: cn("text-xs font-medium", tk.fgDestructive), children: tray.problem })
  ] });
}
var NO_FILES = [];
var attachmentSeq = 0;
function AttachmentTray({
  accept,
  max: max2,
  children
}) {
  const { upload, error } = useFileUpload();
  const [items2, setItems] = useState22([]);
  const [problem, setProblem] = useState22(null);
  const inputRef = useRef15(null);
  const held = useRef15([]);
  held.current = items2;
  useEffect15(
    () => () => {
      for (const it of held.current) revoke(it.preview);
    },
    []
  );
  const patch = (id, change) => setItems((list) => list.map((it) => it.id === id ? { ...it, ...change } : it));
  const add = useCallback7(
    (picked) => {
      if (picked.length === 0) return;
      const wanted = picked.filter((f) => accepts(f, accept));
      const room = Math.max(0, max2 - held.current.length);
      const taken = wanted.slice(0, room);
      if (wanted.length < picked.length) setProblem("That kind of file cannot be attached here.");
      else if (taken.length < wanted.length) setProblem(`A message can carry ${max2} file${max2 === 1 ? "" : "s"} at most.`);
      else setProblem(null);
      if (taken.length === 0) return;
      const fresh = taken.map((file) => ({
        id: `att-${++attachmentSeq}`,
        name: file.name,
        preview: file.type.startsWith("image/") ? objectUrl(file) : void 0,
        status: "uploading",
        progress: 0,
        file
      }));
      held.current = [...held.current, ...fresh];
      setItems((list) => [...list, ...fresh.map(({ file: _file, ...chip2 }) => chip2)]);
      for (const { id, file } of fresh) {
        void upload(file, { onProgress: (pct) => patch(id, { progress: pct }) }).then(
          (ref) => patch(id, ref ? { status: "done", progress: 100, ref } : { status: "error" })
        );
      }
    },
    [accept, max2, upload]
  );
  const remove = (id) => {
    setItems((list) => {
      revoke(list.find((it) => it.id === id)?.preview);
      return list.filter((it) => it.id !== id);
    });
    setProblem(null);
  };
  const clear = () => {
    for (const it of held.current) revoke(it.preview);
    setItems([]);
    setProblem(null);
  };
  const failed = items2.some((it) => it.status === "error");
  const tray = {
    ready: items2.flatMap((it) => it.status === "done" && it.ref ? [it.ref] : []),
    uploading: items2.some((it) => it.status === "uploading"),
    full: items2.length >= max2,
    problem: problem ?? (failed ? error?.message ?? "A file could not be uploaded." : null),
    browse: () => inputRef.current?.click(),
    clear,
    onPaste: (e) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length === 0) return;
      e.preventDefault();
      add(files);
    },
    onDrop: (e) => {
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length === 0) return;
      e.preventDefault();
      add(files);
    },
    onDragOver: (e) => {
      if (Array.from(e.dataTransfer?.types ?? []).includes("Files")) e.preventDefault();
    },
    list: items2.length === 0 ? null : /* @__PURE__ */ jsx44("ul", { "aria-label": "Attachments", className: "m-0 flex list-none flex-wrap gap-2 p-0", children: items2.map((it) => /* @__PURE__ */ jsxs39(
      "li",
      {
        "data-rm-attachment": it.status,
        className: cn(
          "flex max-w-[15rem] items-center gap-2 border py-1 pl-1 pr-1 text-xs",
          tk.radiusMd,
          tk.bgCard,
          tk.fg,
          it.status === "error" ? tk.borderDestructive : tk.border
        ),
        children: [
          it.preview ? /* @__PURE__ */ jsx44("img", { src: it.preview, alt: "", className: cn("h-8 w-8 shrink-0 object-cover", tk.radiusSm) }) : /* @__PURE__ */ jsx44(
            "span",
            {
              "aria-hidden": "true",
              className: cn("flex h-8 w-8 shrink-0 items-center justify-center", tk.radiusSm, tk.bgMuted, tk.fgMuted),
              children: /* @__PURE__ */ jsx44(Icon, { name: "file", size: 16 })
            }
          ),
          /* @__PURE__ */ jsx44("span", { className: "min-w-0 flex-1 truncate", title: it.name, children: it.name }),
          it.status === "uploading" && /* @__PURE__ */ jsxs39("span", { role: "status", "aria-label": `Uploading ${it.name}`, className: cn("flex items-center gap-1 tabular-nums", tk.fgMuted), children: [
            /* @__PURE__ */ jsx44(Spinner, { className: "h-3.5 w-3.5" }),
            Math.round(it.progress),
            "%"
          ] }),
          it.status === "error" && /* @__PURE__ */ jsx44(Icon, { name: "circle-alert", size: 14, label: "Upload failed", className: tk.fgDestructive }),
          /* @__PURE__ */ jsx44(
            "button",
            {
              type: "button",
              "aria-label": `Remove ${it.name}`,
              onClick: () => remove(it.id),
              className: cn("shrink-0 p-1", ghostControl, focusRing),
              children: /* @__PURE__ */ jsx44(Icon, { name: "x", size: 14 })
            }
          )
        ]
      },
      it.id
    )) })
  };
  return /* @__PURE__ */ jsxs39(Fragment13, { children: [
    /* @__PURE__ */ jsx44(
      "input",
      {
        ref: inputRef,
        type: "file",
        multiple: max2 > 1,
        accept,
        className: "sr-only",
        tabIndex: -1,
        "aria-hidden": "true",
        "data-rm-composer-file": "",
        onChange: (e) => {
          add(Array.from(e.target.files ?? []));
          e.target.value = "";
        }
      }
    ),
    children(tray)
  ] });
}
function accepts(file, accept) {
  if (!accept) return true;
  const rules = accept.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}
function objectUrl(file) {
  try {
    return typeof URL !== "undefined" && typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : void 0;
  } catch {
    return void 0;
  }
}
function revoke(url) {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
  }
}
function formatAt2(at) {
  const ms = Date.parse(at);
  if (Number.isNaN(ms) || !/^\d{4}-\d{2}-\d{2}/.test(at)) return at;
  return new Date(ms).toLocaleString(void 0, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// src/components/image-grid.tsx
import {
  useCallback as useCallback8,
  useEffect as useEffect16,
  useLayoutEffect as useLayoutEffect4,
  useMemo as useMemo4,
  useRef as useRef16,
  useState as useState23
} from "react";
import { jsx as jsx45, jsxs as jsxs40 } from "react/jsx-runtime";
var COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8"
};
var MD_COLS = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  7: "md:grid-cols-7",
  8: "md:grid-cols-8"
};
var LG_COLS = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
  8: "lg:grid-cols-8"
};
var DEFAULT_COLUMNS = {
  mosaic: { base: 4, md: 6, lg: 8 },
  compact: { base: 3, md: 4, lg: 6 },
  comfortable: { base: 2, md: 3, lg: 4 }
};
var GAP = {
  mosaic: "gap-0.5",
  compact: "gap-2",
  comfortable: "gap-4"
};
var GAP_PX = { mosaic: 2, compact: 8, comfortable: 16 };
var STRIP_TILE = {
  mosaic: "w-16",
  compact: "w-24",
  comfortable: "w-40"
};
var TILE_RADIUS = {
  mosaic: "none",
  compact: "sm",
  comfortable: "md"
};
var OVERLAY_RADIUS = {
  mosaic: "rounded-none",
  compact: tk.radiusSm,
  comfortable: tk.radiusMd
};
var WINDOW_ABOVE = 600;
var OVERSCAN_ROWS = 4;
function clampCols(n) {
  if (n === void 0 || !Number.isFinite(n)) return void 0;
  return Math.min(8, Math.max(1, Math.round(n)));
}
function ratioOf(aspect) {
  if (typeof aspect === "number") return aspect > 0 ? aspect : 1;
  if (aspect === "auto") return 1;
  const [w, h] = aspect.split(":").map(Number);
  return w > 0 && h > 0 ? w / h : 1;
}
function solveFill(count, width, height, gap, ratio) {
  if (count <= 0 || width <= 0 || height <= 0) return { columns: 1, tile: 0 };
  let best = { columns: 1, tile: 0 };
  for (let c = 1; c <= count; c++) {
    const rows = Math.ceil(count / c);
    const byWidth = (width - gap * (c - 1)) / c;
    const byHeight = (height - gap * (rows - 1)) / rows * ratio;
    const tile = Math.floor(Math.min(byWidth, byHeight) * 100) / 100;
    if (tile > best.tile) best = { columns: c, tile };
    if (byWidth <= byHeight) break;
  }
  return best;
}
function ImageGrid({
  items: given,
  layout = "grid",
  columns,
  density = "comfortable",
  aspect = "1:1",
  selectedKey,
  onSelect,
  selectable = false,
  selection,
  onSelectionChange,
  fill = false,
  total,
  highlightNew = 0,
  source,
  emptyState = "No pictures yet.",
  label = "Pictures",
  className
}) {
  const remote = useSourceItems(source);
  const items2 = remote.active ? remote.items : given ?? [];
  const count = items2.length;
  const slots = Math.max(count, total ?? 0, remote.loading && count === 0 ? remote.pageSize || 8 : 0);
  const strip = layout === "strip";
  const filling = fill && !strip;
  const interactive = selectable || !!onSelect;
  const gapPx = GAP_PX[density];
  const tileAspect = filling && aspect === "auto" ? "1:1" : aspect;
  const { ref: boxRef, width, height, measured } = useMeasure();
  const cols = useMemo4(() => {
    const d = DEFAULT_COLUMNS[density];
    if (typeof columns === "number") {
      const n = clampCols(columns) ?? d.base;
      return { base: n, md: void 0, lg: void 0 };
    }
    if (columns) {
      return { base: clampCols(columns.base) ?? d.base, md: clampCols(columns.md), lg: clampCols(columns.lg) };
    }
    return d;
  }, [columns, density]);
  const solved = useMemo4(() => {
    if (!filling) return null;
    if (measured && width > 0 && height > 0) return solveFill(slots, width, height, gapPx, ratioOf(tileAspect));
    return { columns: Math.max(1, Math.ceil(Math.sqrt(slots * ratioOf(tileAspect)))), tile: 0 };
  }, [filling, measured, width, height, slots, gapPx, tileAspect]);
  const columnsNow = useCallback8(() => {
    if (strip) return 1;
    if (solved) return solved.columns;
    const box = boxRef.current;
    const tiles = box ? Array.from(box.querySelectorAll("[data-rm-image-index]")) : [];
    if (box && box.getBoundingClientRect().width > 0 && tiles.length > 1) {
      const top = tiles[0].offsetTop;
      const inRow = tiles.findIndex((t) => t.offsetTop !== top);
      return inRow === -1 ? tiles.length : inRow;
    }
    return cols.base;
  }, [strip, solved, cols.base, boxRef]);
  const [active, setActive] = useState23(0);
  const wantFocus = useRef16(false);
  const anchor = useRef16(null);
  const activeIndex = Math.min(active, Math.max(0, count - 1));
  useLayoutEffect4(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    const el = boxRef.current?.querySelector(`[data-rm-image-index="${activeIndex}"]`);
    if (!el) return;
    el.focus();
    if (strip && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeIndex, strip, boxRef]);
  const focusTile = (index) => {
    const next = Math.min(count - 1, Math.max(0, index));
    wantFocus.current = true;
    if (next === activeIndex) {
      wantFocus.current = false;
      boxRef.current?.querySelector(`[data-rm-image-index="${next}"]`)?.focus();
      return;
    }
    setActive(next);
  };
  const chosen = useMemo4(() => new Set(selection ?? []), [selection]);
  const toggle = (index, range) => {
    const item = items2[index];
    if (!item) return;
    const next = new Set(chosen);
    if (range && anchor.current !== null) {
      const [lo, hi] = anchor.current < index ? [anchor.current, index] : [index, anchor.current];
      for (let i = lo; i <= hi; i++) next.add(items2[i].key);
    } else if (next.has(item.key)) {
      next.delete(item.key);
    } else {
      next.add(item.key);
    }
    anchor.current = index;
    onSelectionChange?.(items2.filter((it) => next.has(it.key)).map((it) => it.key));
  };
  const onTileClick = (index, e) => {
    if (!interactive) return;
    setActive(index);
    if (selectable) toggle(index, e.shiftKey);
    else onSelect?.(items2[index]);
  };
  const onKeyDown = (e) => {
    if (!interactive || count === 0) return;
    const per = columnsNow();
    const i = activeIndex;
    let to = null;
    switch (e.key) {
      case "ArrowRight":
        to = i + 1;
        break;
      case "ArrowLeft":
        to = i - 1;
        break;
      case "ArrowDown":
        if (!strip) to = i + per < count ? i + per : i;
        break;
      case "ArrowUp":
        if (!strip) to = i - per >= 0 ? i - per : i;
        break;
      case "Home":
        to = e.ctrlKey || strip ? 0 : i - i % per;
        break;
      case "End":
        to = e.ctrlKey || strip ? count - 1 : Math.min(count - 1, i - i % per + per - 1);
        break;
      case "PageDown":
        if (!strip) to = Math.min(count - 1, i + per * 3);
        break;
      case "PageUp":
        if (!strip) to = Math.max(0, i - per * 3);
        break;
      case " ":
        e.preventDefault();
        if (selectable) toggle(i, e.shiftKey);
        else onSelect?.(items2[i]);
        return;
      case "Enter":
        e.preventDefault();
        if (onSelect) onSelect(items2[i]);
        else if (selectable) toggle(i, false);
        return;
      case "a":
      case "A":
        if (selectable && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          onSelectionChange?.(items2.map((it) => it.key));
        }
        return;
      default:
        return;
    }
    if (to === null) return;
    e.preventDefault();
    focusTile(to);
  };
  const windowing = !strip && !filling && measured && slots > WINDOW_ABOVE;
  const [rowMetrics, setRowMetrics] = useState23(null);
  const [visible, setVisible] = useState23(null);
  useLayoutEffect4(() => {
    if (!windowing) {
      if (rowMetrics) setRowMetrics(null);
      return;
    }
    const box = boxRef.current;
    const first = box?.querySelector("[data-rm-image-index]");
    if (!box || !first) return;
    const h = first.getBoundingClientRect().height;
    if (h <= 0) return;
    const per = columnsNow();
    const rowHeight = h + gapPx;
    setRowMetrics((m) => m && m.per === per && Math.abs(m.rowHeight - rowHeight) < 0.5 ? m : { per, rowHeight });
  }, [windowing, width, gapPx, density, aspect, cols.base, cols.md, cols.lg]);
  useEffect16(() => {
    if (!windowing || !rowMetrics) {
      setVisible(null);
      return;
    }
    const read = () => {
      const box = boxRef.current;
      if (!box) return;
      const top = box.getBoundingClientRect().top;
      const view = window.innerHeight || 0;
      const first = Math.max(0, Math.floor(-top / rowMetrics.rowHeight) - OVERSCAN_ROWS);
      const last = Math.max(first, Math.ceil((view - top) / rowMetrics.rowHeight) + OVERSCAN_ROWS);
      setVisible((v) => v && v.first === first && v.last === last ? v : { first, last });
    };
    read();
    window.addEventListener("scroll", read, true);
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read, true);
      window.removeEventListener("resize", read);
    };
  }, [windowing, rowMetrics, boxRef]);
  if (slots === 0 && !remote.loading) {
    return /* @__PURE__ */ jsx45("div", { "data-rm-image-grid": "", "data-rm-layout": layout, ...source ? sourceLinkAttrs(source) : {}, className, children: remote.error ? /* @__PURE__ */ jsx45("p", { role: "alert", className: cn("text-sm font-medium", tk.fgDestructive), children: remote.error }) : typeof emptyState === "string" ? /* @__PURE__ */ jsx45(EmptyState, { icon: "images", title: emptyState }) : emptyState });
  }
  const fresh = Math.max(0, Math.min(highlightNew, count));
  const multi = selectable;
  const cell = (index) => {
    const item = items2[index];
    if (!item) {
      return /* @__PURE__ */ jsx45(
        "div",
        {
          "aria-hidden": "true",
          "data-rm-image-slot": "",
          className: cn(strip && cn("shrink-0", STRIP_TILE[density])),
          children: /* @__PURE__ */ jsx45(EmptySlot, { aspect: tileAspect, radius: OVERLAY_RADIUS[density] })
        },
        `slot-${index}`
      );
    }
    const selected = multi ? chosen.has(item.key) : item.key === selectedKey;
    const isNew = fresh > 0 && index >= count - fresh;
    return /* @__PURE__ */ jsxs40(
      "div",
      {
        role: interactive ? "option" : "listitem",
        "aria-selected": interactive ? selected : void 0,
        "aria-label": item.alt || item.caption || void 0,
        tabIndex: interactive ? index === activeIndex ? 0 : -1 : void 0,
        "data-rm-image-tile": item.key,
        "data-rm-image-index": index,
        "data-rm-anim": isNew ? "fade" : void 0,
        "data-state": isNew ? "open" : void 0,
        onClick: interactive ? (e) => onTileClick(index, e) : void 0,
        onFocus: interactive ? () => setActive(index) : void 0,
        className: cn(
          "group relative min-w-0 text-left outline-none",
          OVERLAY_RADIUS[density],
          strip && cn("shrink-0 snap-start", STRIP_TILE[density]),
          interactive && cn("cursor-pointer focus-visible:z-10", focusRing),
          item.dimmed && "opacity-40"
        ),
        children: [
          /* @__PURE__ */ jsxs40("span", { className: "relative block", children: [
            /* @__PURE__ */ jsx45(
              Image,
              {
                src: item.src,
                file: item.file,
                placeholder: item.placeholder,
                alt: interactive ? "" : item.alt,
                aspect: tileAspect,
                radius: TILE_RADIUS[density]
              }
            ),
            selected && /* @__PURE__ */ jsx45(
              "span",
              {
                "aria-hidden": "true",
                className: cn("pointer-events-none absolute inset-0 ring-2 ring-inset", tk.ring, OVERLAY_RADIUS[density])
              }
            ),
            item.badge !== void 0 && /* @__PURE__ */ jsx45("span", { className: "pointer-events-none absolute left-1.5 top-1.5 z-[1] max-w-[calc(100%-0.75rem)]", children: item.badge }),
            multi && /* @__PURE__ */ jsx45(
              "span",
              {
                "aria-hidden": "true",
                "data-rm-image-tick": "",
                className: cn(
                  "pointer-events-none absolute right-1.5 top-1.5 z-[1] flex h-5 w-5 items-center justify-center rounded-full border transition-opacity",
                  selected ? cn(tk.bgPrimary, tk.fgOnPrimary, tk.borderPrimary) : cn(tk.bgCard, tk.borderInput, "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")
                ),
                children: selected && /* @__PURE__ */ jsx45(Icon, { name: "check", size: 12, strokeWidth: 3 })
              }
            )
          ] }),
          item.caption && density !== "mosaic" && /* @__PURE__ */ jsx45("span", { className: cn("mt-1.5 block truncate", textStyles.caption), title: item.caption, children: item.caption })
        ]
      },
      item.key
    );
  };
  const cells = [];
  if (windowing && rowMetrics && visible) {
    const { per, rowHeight } = rowMetrics;
    const rows = Math.ceil(slots / per);
    const activeRow = Math.floor(activeIndex / per);
    const ranges = [[visible.first, Math.min(rows - 1, visible.last)]];
    if (interactive && (activeRow < ranges[0][0] - 1 || activeRow > ranges[0][1] + 1)) {
      ranges.push([activeRow, activeRow]);
      ranges.sort((a, b) => a[0] - b[0]);
    } else if (interactive) {
      ranges[0] = [Math.min(ranges[0][0], activeRow), Math.max(ranges[0][1], activeRow)];
    }
    let next = 0;
    const spacer = (skipped, id) => {
      if (skipped <= 0) return;
      cells.push(
        /* @__PURE__ */ jsx45(
          "div",
          {
            "aria-hidden": "true",
            "data-rm-image-spacer": "",
            style: { gridColumn: "1 / -1", height: Math.max(0, skipped * rowHeight - gapPx) }
          },
          id
        )
      );
    };
    for (const [from, to] of ranges) {
      if (from > rows - 1) break;
      spacer(from - next, `gap-${next}`);
      for (let i = from * per; i < Math.min(slots, (to + 1) * per); i++) cells.push(cell(i));
      next = to + 1;
    }
    spacer(rows - next, "gap-end");
  } else {
    for (let i = 0; i < slots; i++) cells.push(cell(i));
  }
  const fillStyle = solved ? {
    gridTemplateColumns: solved.tile > 0 ? `repeat(${solved.columns}, ${solved.tile}px)` : `repeat(${solved.columns}, minmax(0, 1fr))`,
    justifyContent: "center",
    alignContent: "center"
  } : void 0;
  return /* @__PURE__ */ jsxs40("div", { className: cn("text-left", filling && "flex min-h-0 flex-col", className), children: [
    /* @__PURE__ */ jsx45(
      "div",
      {
        ref: boxRef,
        role: interactive ? "listbox" : "list",
        "aria-label": label,
        "aria-multiselectable": interactive && multi ? true : void 0,
        "aria-orientation": interactive && strip ? "horizontal" : void 0,
        "aria-busy": remote.loading || void 0,
        "data-rm-image-grid": "",
        "data-rm-layout": filling ? "fill" : layout,
        "data-rm-density": density,
        ...source ? sourceLinkAttrs(source) : {},
        onKeyDown,
        style: fillStyle,
        className: cn(
          GAP[density],
          strip ? "flex snap-x overflow-x-auto pb-2" : cn("grid", !solved && cn(COLS[cols.base], cols.md && MD_COLS[cols.md], cols.lg && LG_COLS[cols.lg])),
          filling && "min-h-0 w-full flex-1 overflow-hidden"
        ),
        children: cells
      }
    ),
    remote.active && remote.hasMore && /* @__PURE__ */ jsx45("div", { className: "mt-3 flex justify-center", children: /* @__PURE__ */ jsx45(Button, { variant: "secondary", size: "sm", loading: remote.loading, onClick: remote.more, children: "Show more" }) }),
    remote.active && remote.error && count > 0 && /* @__PURE__ */ jsx45("p", { role: "alert", className: cn("mt-2 text-sm font-medium", tk.fgDestructive), children: remote.error })
  ] });
}
function EmptySlot({ aspect, radius }) {
  return /* @__PURE__ */ jsx45(
    "span",
    {
      className: cn("block w-full", tk.bgMutedHalf, radius),
      style: { aspectRatio: String(ratioOf(aspect)) }
    }
  );
}
function useSourceItems(source) {
  const active = !!source && isActionSource(source);
  const action = active ? source.action : null;
  const pageSize = active ? source.pageSize ?? 0 : 0;
  const name = action?.name ?? "";
  const actionRef = useRef16(action);
  actionRef.current = action;
  const [state, setState] = useState23({ items: [], total: void 0 });
  const [loading, setLoading] = useState23(active);
  const [error, setError] = useState23(null);
  const [reload, setReload] = useState23(0);
  const seq = useRef16(0);
  const held = useRef16([]);
  held.current = state.items;
  const fetchPage = useCallback8(
    async (offset3) => {
      const run = actionRef.current;
      if (!run) return;
      const mine = ++seq.current;
      const req = { filter: "", offset: offset3, limit: pageSize };
      setLoading(true);
      setError(null);
      try {
        const reply = await run.run(req, { refreshOnWrite: false });
        if (mine !== seq.current) return;
        if (reply === void 0) {
          const reason = actionRef.current?.error;
          if (reason) setError(reason instanceof Error ? reason.message : String(reason));
          return;
        }
        const page = readPageReply(reply, req);
        const rows = page.rows.filter((r) => r && typeof r.key === "string");
        setState({ items: offset3 === 0 ? rows : [...held.current, ...rows], total: page.total });
      } catch (e) {
        if (mine === seq.current) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    },
    [pageSize]
  );
  useEffect16(() => {
    if (!active) return;
    void fetchPage(0);
  }, [active, name, fetchPage, reload]);
  useEffect16(() => {
    if (!active) return;
    return onActionDone((writer) => {
      if (writer && writer === actionRef.current?.name) return;
      setReload((t) => t + 1);
    });
  }, [active]);
  const hasMore = active && pageSize > 0 && state.total !== void 0 && state.items.length < state.total;
  const more = useCallback8(() => {
    if (!loading) void fetchPage(held.current.length);
  }, [fetchPage, loading]);
  return { active, items: state.items, pageSize, loading: active && loading, error, hasMore, more };
}

// src/components/image-compare.tsx
import {
  useEffect as useEffect17,
  useRef as useRef17,
  useState as useState24
} from "react";
import { Fragment as Fragment14, jsx as jsx46, jsxs as jsxs41 } from "react/jsx-runtime";
var ASPECT2 = {
  auto: "aspect-[4/3]",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "3:4": "aspect-[3/4]",
  "4:5": "aspect-[4/5]",
  "3:2": "aspect-[3/2]",
  "2:3": "aspect-[2/3]",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]"
};
var chip = cn(
  "pointer-events-none absolute top-2 z-[2] border px-2 py-0.5 text-xs font-medium",
  tk.radiusSm,
  tk.border,
  tk.bgCard,
  tk.fg,
  tk.shadowSm
);
function ImageCompare({
  before,
  after,
  mode = "slider",
  aspect = "4:3",
  fit = "contain",
  position,
  defaultPosition = 0.5,
  onPositionChange,
  className
}) {
  const beforeLabel = before.label ?? "Before";
  const afterLabel = after.label ?? "After";
  if (mode === "side-by-side") {
    return /* @__PURE__ */ jsx46(
      "div",
      {
        "data-rm-image-compare": "side-by-side",
        className: cn("grid grid-cols-1 gap-3 text-left sm:grid-cols-2", className),
        children: [
          { side: before, label: beforeLabel },
          { side: after, label: afterLabel }
        ].map(({ side, label }) => /* @__PURE__ */ jsxs41("figure", { className: "m-0 min-w-0", children: [
          /* @__PURE__ */ jsx46(Image, { src: side.src, file: side.file, alt: side.alt, aspect, fit }),
          /* @__PURE__ */ jsx46("figcaption", { className: cn("mt-1.5 text-xs font-medium", tk.fgMuted), children: label })
        ] }, label))
      }
    );
  }
  return /* @__PURE__ */ jsx46(
    Overlay,
    {
      before,
      after,
      beforeLabel,
      afterLabel,
      hold: mode === "hold",
      aspect,
      fit,
      position,
      defaultPosition,
      onPositionChange,
      className
    }
  );
}
function Overlay({
  before,
  after,
  beforeLabel,
  afterLabel,
  hold,
  aspect,
  fit,
  position,
  defaultPosition,
  onPositionChange,
  className
}) {
  const a = useImageSource(before.src, before.file);
  const b = useImageSource(after.src, after.file);
  const boxRef = useRef17(null);
  const [own, setOwn] = useState24(clamp012(defaultPosition));
  const at = clamp012(position ?? own);
  const [dragging, setDragging] = useState24(false);
  const [held, setHeld] = useState24(false);
  const move = (next) => {
    const to = Math.round(clamp012(next) * 1e3) / 1e3;
    if (position === void 0) setOwn(to);
    onPositionChange?.(to);
  };
  const moveRef = useRef17(move);
  moveRef.current = move;
  useEffect17(() => {
    if (!dragging) return;
    let live = true;
    const onMove = (e) => {
      if (!live) return;
      const r = boxRef.current?.getBoundingClientRect();
      if (r && r.width > 0) moveRef.current((e.clientX - r.left) / r.width);
    };
    const finish = () => {
      live = false;
      setDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [dragging]);
  useEffect17(() => {
    if (!held) return;
    const release = () => setHeld(false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, [held]);
  const onSliderPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width > 0) move((e.clientX - r.left) / r.width);
    setDragging(true);
    e.currentTarget.querySelector('[role="slider"]')?.focus();
  };
  const onSliderKeyDown = (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        move(at - step);
        break;
      case "ArrowRight":
      case "ArrowUp":
        move(at + step);
        break;
      case "PageDown":
        move(at - 0.1);
        break;
      case "PageUp":
        move(at + 0.1);
        break;
      case "Home":
        move(0);
        break;
      case "End":
        move(1);
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  const picture = "absolute inset-0 h-full w-full select-none";
  const pct = Math.round(at * 100);
  const ratioStyle = typeof aspect === "number" && aspect > 0 ? { aspectRatio: String(aspect) } : void 0;
  const missing = !a.url && !a.resolving && !b.url && !b.resolving;
  const showBefore = hold ? held : true;
  return /* @__PURE__ */ jsxs41(
    "div",
    {
      ref: boxRef,
      "data-rm-image-compare": hold ? "hold" : "slider",
      "data-state": hold ? held ? "before" : "after" : void 0,
      onPointerDown: hold ? void 0 : onSliderPointerDown,
      style: ratioStyle,
      className: cn(
        "relative overflow-hidden text-left",
        tk.radiusMd,
        tk.bgMuted,
        typeof aspect === "string" ? ASPECT2[aspect] : void 0,
        !hold && "cursor-ew-resize touch-pan-y",
        className
      ),
      children: [
        missing && /* @__PURE__ */ jsx46(
          "span",
          {
            role: "img",
            "aria-label": "Pictures unavailable",
            className: cn("absolute inset-0 flex items-center justify-center", tk.fgFaint),
            children: /* @__PURE__ */ jsx46(Icon, { name: "image-off", size: 24, strokeWidth: 1.5 })
          }
        ),
        hold ? /* @__PURE__ */ jsxs41(Fragment14, { children: [
          b.url && /* @__PURE__ */ jsx46("img", { src: b.url, alt: held ? "" : after.alt, draggable: false, className: cn(picture, fitClass) }),
          a.url && showBefore && /* @__PURE__ */ jsx46("img", { src: a.url, alt: before.alt, draggable: false, className: cn(picture, fitClass, tk.bgMuted) }),
          /* @__PURE__ */ jsx46(
            "button",
            {
              type: "button",
              "aria-pressed": held,
              "aria-label": `Hold to show ${beforeLabel.toLowerCase()}`,
              onPointerDown: (e) => {
                if (e.pointerType === "mouse" && e.button !== 0) return;
                setHeld(true);
              },
              onKeyDown: (e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setHeld(true);
                }
              },
              onKeyUp: (e) => {
                if (e.key === " " || e.key === "Enter") setHeld(false);
              },
              onBlur: () => setHeld(false),
              onContextMenu: (e) => e.preventDefault(),
              className: cn(
                "absolute inset-0 z-[1] cursor-pointer touch-pan-y select-none",
                tk.radiusMd,
                focusRing,
                "focus-visible:ring-inset focus-visible:ring-offset-0"
              )
            }
          ),
          /* @__PURE__ */ jsx46("span", { "aria-live": "polite", "data-rm-image-compare-chip": "", className: cn(chip, "left-2"), children: held ? beforeLabel : afterLabel }),
          /* @__PURE__ */ jsx46("span", { className: cn(chip, "bottom-2 right-2 top-auto", tk.fgMuted), children: "Hold to compare" })
        ] }) : /* @__PURE__ */ jsxs41(Fragment14, { children: [
          a.url && /* @__PURE__ */ jsx46("img", { src: a.url, alt: before.alt, draggable: false, className: cn(picture, fitClass) }),
          b.url && /* @__PURE__ */ jsx46(
            "img",
            {
              src: b.url,
              alt: after.alt,
              draggable: false,
              "data-rm-image-compare-after": "",
              style: { clipPath: `inset(0 0 0 ${at * 100}%)` },
              className: cn(picture, fitClass, tk.bgMuted)
            }
          ),
          /* @__PURE__ */ jsx46("span", { className: cn(chip, "left-2"), children: beforeLabel }),
          /* @__PURE__ */ jsx46("span", { className: cn(chip, "right-2"), children: afterLabel }),
          /* @__PURE__ */ jsx46(
            "div",
            {
              "aria-hidden": "true",
              className: cn("pointer-events-none absolute inset-y-0 z-[1] w-0.5 -translate-x-1/2", tk.bgCard, tk.shadowMd),
              style: { left: `${at * 100}%` }
            }
          ),
          /* @__PURE__ */ jsx46(
            "div",
            {
              role: "slider",
              tabIndex: 0,
              "aria-label": `Divider between ${beforeLabel.toLowerCase()} and ${afterLabel.toLowerCase()}`,
              "aria-orientation": "horizontal",
              "aria-valuemin": 0,
              "aria-valuemax": 100,
              "aria-valuenow": pct,
              "aria-valuetext": `${pct}% ${beforeLabel.toLowerCase()}`,
              onKeyDown: onSliderKeyDown,
              style: { left: `${at * 100}%` },
              className: cn(
                "absolute top-1/2 z-[2] flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border",
                tk.border,
                tk.bgCard,
                tk.fg,
                tk.shadowMd,
                dragging ? "cursor-grabbing" : "cursor-grab",
                focusRing
              ),
              children: /* @__PURE__ */ jsx46(Icon, { name: "chevrons-left-right", size: 16 })
            }
          )
        ] })
      ]
    }
  );
}
function clamp012(n) {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5;
}

// src/components/data-table.tsx
import {
  useCallback as useCallback9,
  useEffect as useEffect19,
  useMemo as useMemo5,
  useRef as useRef18,
  useState as useState26
} from "react";

// src/components/error-state.tsx
import { useEffect as useEffect18, useState as useState25 } from "react";
import { AppError } from "@robomotion/apps-runtime";
import { useMaybeAppClient as useMaybeAppClient2 } from "@robomotion/apps-runtime/react";
import { jsx as jsx47, jsxs as jsxs42 } from "react/jsx-runtime";
function plainMessage(raw) {
  let s = raw.replace(/\r/g, "");
  s = s.replace(/^[^\S\n]*at\s[^\n]*$/gm, "");
  s = s.split(/\s+/).filter(Boolean).join(" ");
  for (; ; ) {
    const trimmed = s.replace(/\s at\s\S+ ?\([^)]*\) ?$/, "");
    if (trimmed === s) break;
    s = trimmed;
  }
  const label = /^([A-Za-z]*Error):\s+/.exec(s);
  if (label && label[0].length < 40) s = s.slice(label[0].length);
  s = s.trim();
  return s || "Something went wrong.";
}
function messageOf(error) {
  if (error instanceof AppError) return plainMessage(error.message);
  if (error instanceof Error) return plainMessage(error.message);
  if (typeof error === "string") return plainMessage(error);
  return "Something went wrong.";
}
function defaultTitle(error) {
  if (error instanceof AppError) {
    if (error.code === "robot_offline") return "Not connected to your robot right now";
    if (error.code === "contract_mismatch") return "This app needs a restart";
    if (error.code === "timeout") return "That took too long";
    if (error.code === "invalid_params" || looksLikeRefusal(error)) return "That didn't go through";
  }
  return "Something went wrong";
}
function looksLikeRefusal(error) {
  if (error.retryable) return false;
  const text = plainMessage(error.message);
  if (!text || text === "Something went wrong.") return false;
  if (/[\/\\]|\bat\s+\S+\(|\b(?:undefined|null|NaN|TypeError|ReferenceError|ENOENT|EACCES|ECONN)\b|[{}<>;=]/.test(text)) {
    return false;
  }
  return /[.!]$/.test(text) && /^[A-Z"']/.test(text);
}
function useSaidByTheBanner(error) {
  const app = useMaybeAppClient2();
  const [state, setState] = useState25(app?.connection.state);
  useEffect18(() => {
    if (!app) return;
    setState(app.connection.state);
    return app.connection.onChange(setState);
  }, [app]);
  if (state !== "unconfigured") return false;
  return error instanceof AppError && error.code === "robot_offline";
}
function ErrorState({
  error,
  title,
  onRetry,
  retryLabel = "Try again",
  className,
  ...props
}) {
  const saidByTheBanner = useSaidByTheBanner(error);
  const retryable = error instanceof AppError ? error.retryable : true;
  const heading = title ?? defaultTitle(error);
  if (saidByTheBanner) return null;
  return /* @__PURE__ */ jsxs42(
    "div",
    {
      role: "alert",
      className: cn(
        "flex flex-col items-start gap-2 border px-4 py-4 text-left",
        tk.radius,
        tk.borderDestructiveSoft,
        tk.bgDestructiveSoft,
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsxs42("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx47(Icon, { name: "circle-alert", size: 20, strokeWidth: 1.75, className: tk.fgDestructive }),
          /* @__PURE__ */ jsx47("h3", { className: cn("text-sm font-semibold", tk.fg), children: heading })
        ] }),
        /* @__PURE__ */ jsx47("p", { className: cn("text-sm", tk.fgMuted), children: messageOf(error) }),
        onRetry && retryable && /* @__PURE__ */ jsx47(Button, { variant: "outline", size: "sm", icon: "refresh-cw", className: "mt-1", onClick: onRetry, children: retryLabel })
      ]
    }
  );
}

// src/components/data-table.tsx
import { jsx as jsx48, jsxs as jsxs43 } from "react/jsx-runtime";
function isLinkedAction(a) {
  return "action" in a && !!a.action;
}
function isLinkedBulk(a) {
  return "action" in a && !!a.action;
}
var NO_ROWS = [];
function defaultValue(row, col) {
  if (col.value) return col.value(row);
  const v = row[col.key];
  if (v === null || v === void 0) return v;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  return String(v);
}
function DataTable(props) {
  const {
    columns,
    rows = NO_ROWS,
    rowKey,
    source,
    filterable = false,
    filterPlaceholder = "Filter rows",
    pageSize = 10,
    rowActions,
    onRowClick,
    caption,
    emptyTitle = "Nothing here yet",
    emptyDescription,
    emptyState,
    loading = false,
    className,
    tableRef,
    selectable = false,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    bulkActions,
    exportable = false,
    exportFilename = "export.csv"
  } = props;
  const [filter, setFilter] = useState26("");
  const [sortKey, setSortKey] = useState26(null);
  const [sortDir, setSortDir] = useState26("asc");
  const [page, setPage] = useState26(0);
  const paged = !!source && isActionSource(source);
  const pagedAction = paged ? source.action : null;
  const actionName = pagedAction?.name ?? "";
  const actionRef = useRef18(pagedAction);
  actionRef.current = pagedAction;
  const effPageSize = paged ? source.pageSize ?? pageSize : pageSize;
  const [remote, setRemote] = useState26(null);
  const [remoteLoading, setRemoteLoading] = useState26(false);
  const [remoteError, setRemoteError] = useState26(null);
  const [reloadTick, setReloadTick] = useState26(0);
  const seq = useRef18(0);
  const ownFetch = useRef18(false);
  const superseded = useRef18(0);
  const [askedFilter, setAskedFilter] = useState26("");
  useEffect19(() => {
    if (!paged) return;
    const t = setTimeout(() => setAskedFilter(filter), 250);
    return () => clearTimeout(t);
  }, [filter, paged]);
  const paging = effPageSize > 0;
  const inMemoryTotal = useRef18(0);
  const total = paged ? remote?.total ?? rows.length : inMemoryTotal.current;
  const pageCount = paging ? Math.max(1, Math.ceil(total / effPageSize)) : 1;
  const clampedPage = Math.min(page, pageCount - 1);
  const fetchPage = useCallback9(async () => {
    const action = actionRef.current;
    if (!action) return;
    const req = {
      filter: askedFilter,
      sort: sortKey ? { key: sortKey, dir: sortDir } : void 0,
      offset: clampedPage * (effPageSize || 0),
      limit: effPageSize
    };
    if (noteSourceFetch(action.name)) {
      setRemoteError(new Error(RUNAWAY_MESSAGE));
      setRemoteLoading(false);
      return;
    }
    const mine = ++seq.current;
    ownFetch.current = true;
    setRemoteLoading(true);
    setRemoteError(null);
    try {
      const reply = await action.run(req, { refreshOnWrite: false });
      if (mine !== seq.current) return;
      const failure = reply === void 0 ? action.error : void 0;
      if (failure) {
        setRemoteError(failure);
        setRemote({ rows: [], total: 0 });
        return;
      }
      if (reply === void 0) {
        superseded.current += 1;
        if (superseded.current < 2) {
          ownFetch.current = false;
          if (!(actionRef.current?.loading ?? false)) setReloadTick((t) => t + 1);
          return;
        }
      }
      superseded.current = 0;
      setRemote(readPageReply(reply, req));
    } catch (e) {
      if (mine !== seq.current) return;
      setRemoteError(e);
      setRemote({ rows: [], total: 0 });
    } finally {
      if (mine === seq.current) setRemoteLoading(false);
    }
  }, [askedFilter, sortKey, sortDir, clampedPage, effPageSize]);
  useEffect19(() => {
    if (!paged || !actionName) return;
    void fetchPage();
  }, [paged, actionName, fetchPage, reloadTick]);
  const wasLoading = useRef18(false);
  useEffect19(() => {
    if (!paged) {
      wasLoading.current = false;
      return;
    }
    const busy2 = actionRef.current?.loading ?? false;
    if (wasLoading.current && !busy2) {
      if (ownFetch.current) ownFetch.current = false;
      else setReloadTick((t) => t + 1);
    }
    wasLoading.current = busy2;
  });
  useEffect19(() => {
    if (!paged) return;
    return onActionDone((name) => {
      if (name && name === actionRef.current?.name) return;
      setReloadTick((t) => t + 1);
    });
  }, [paged]);
  const refresh = useCallback9(() => {
    const name = actionRef.current?.name;
    if (name) clearSourceFetches(name);
    setRemoteError(null);
    setReloadTick((t) => t + 1);
  }, []);
  const filtered = useMemo5(() => {
    if (paged) return NO_ROWS;
    const needle = filter.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) => columns.some((col) => {
        const v = defaultValue(row, col);
        return v !== null && v !== void 0 && String(v).toLowerCase().includes(needle);
      })
    );
  }, [paged, rows, columns, filter]);
  const sorted = useMemo5(() => {
    if (paged || !sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = defaultValue(a, col);
      const vb = defaultValue(b, col);
      if (va === null || va === void 0) return vb === null || vb === void 0 ? 0 : 1;
      if (vb === null || vb === void 0) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), void 0, { numeric: true }) * dir;
    });
  }, [paged, filtered, columns, sortKey, sortDir]);
  inMemoryTotal.current = sorted.length;
  const pageRows = paged ? remote?.rows ?? rows : paging ? sorted.slice(clampedPage * effPageSize, clampedPage * effPageSize + effPageSize) : sorted;
  useEffect19(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);
  const keyOf = useCallback9(
    (row, index) => rowKey ? rowKey(row) : String(clampedPage * effPageSize + index),
    [rowKey, clampedPage, effPageSize]
  );
  const [ownKeys, setOwnKeys] = useState26(defaultSelectedKeys ?? []);
  const [allMatching, setAllMatching] = useState26(false);
  const keys = selectedKeys ?? ownKeys;
  const keySet = useMemo5(() => new Set(keys), [keys]);
  const seen = useRef18(/* @__PURE__ */ new Map());
  pageRows.forEach((row, i) => {
    if (selectable) seen.current.set(keyOf(row, i), row);
  });
  const rowsFor = useCallback9(
    (list) => list.map((k) => seen.current.get(k)).filter((r) => r !== void 0),
    []
  );
  const setKeys = useCallback9(
    (next) => {
      if (selectedKeys === void 0) setOwnKeys(next);
      onSelectionChange?.(next, next.map((k) => seen.current.get(k)).filter((r) => r !== void 0));
    },
    [selectedKeys, onSelectionChange]
  );
  const selectionCount = allMatching ? total : keys.length;
  const selection = useMemo5(
    () => allMatching ? { allMatching: true, filter, count: total } : { keys, rows: rowsFor(keys), filter, count: keys.length },
    [allMatching, keys, filter, total, rowsFor]
  );
  const clearSelection = useCallback9(() => {
    setAllMatching(false);
    if (selectedKeys === void 0) setOwnKeys([]);
    onSelectionChange?.([], []);
  }, [selectedKeys, onSelectionChange]);
  useEffect19(() => {
    setAllMatching(false);
  }, [askedFilter, filter]);
  const selectionRef = useRef18(selection);
  selectionRef.current = selection;
  useEffect19(() => {
    if (!tableRef) return;
    tableRef.current = {
      refresh,
      // The row type is the caller's to name; the table only ever holds T.
      selection: () => selectionRef.current,
      clearSelection
    };
    return () => {
      tableRef.current = null;
    };
  }, [tableRef, refresh, clearSelection]);
  const pageKeys = useMemo5(
    () => selectable ? pageRows.map((row, i) => keyOf(row, i)) : [],
    // pageRows is a fresh array every render; its contents are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectable, pageRows, keyOf]
  );
  const pageAllSelected = pageKeys.length > 0 && pageKeys.every((k) => keySet.has(k));
  const pageSomeSelected = !pageAllSelected && pageKeys.some((k) => keySet.has(k));
  const togglePage = () => {
    setAllMatching(false);
    if (pageAllSelected) setKeys(keys.filter((k) => !pageKeys.includes(k)));
    else setKeys([...keys, ...pageKeys.filter((k) => !keySet.has(k))]);
  };
  const toggleRow = (key) => {
    setAllMatching(false);
    setKeys(keySet.has(key) ? keys.filter((k) => k !== key) : [...keys, key]);
  };
  const selectAllMatching = () => {
    if (paged) {
      setAllMatching(true);
      return;
    }
    setKeys(sorted.map((row, i) => rowKey ? rowKey(row) : String(i)));
  };
  const afterOwnWrite = useCallback9(() => {
    if (paged) setReloadTick((t) => t + 1);
    setAllMatching(false);
    if (selectedKeys === void 0) setOwnKeys([]);
    onSelectionChange?.([], []);
  }, [paged, selectedKeys, onSelectionChange]);
  const runBulk = (a) => {
    const sel = selectionRef.current;
    if (isLinkedBulk(a)) {
      void runAction(a.action, a.params ? a.params(sel) : sel).then(() => afterOwnWrite()).catch(() => void 0);
      return;
    }
    a.onSelect(sel);
  };
  const bulkNames = joinNames((bulkActions ?? []).map((a) => isLinkedBulk(a) ? a.action.name : void 0));
  const [exporting, setExporting] = useState26(false);
  const exportColumns = useMemo5(() => columns.filter((c) => !c.noExport), [columns]);
  const exportCsv = async () => {
    setExporting(true);
    try {
      let out;
      if (paged && actionRef.current) {
        const req = {
          filter: askedFilter,
          sort: sortKey ? { key: sortKey, dir: sortDir } : void 0,
          offset: 0,
          limit: 0
        };
        const reply = await actionRef.current.run(req, { refreshOnWrite: false });
        out = readPageReply(reply, req).rows;
      } else {
        out = sorted;
      }
      downloadCsv(exportFilename, toCsv(exportColumns, out));
    } catch {
    } finally {
      setExporting(false);
    }
  };
  const toggleSort = (col) => {
    if (!col.sortable) return;
    setPage(0);
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
  };
  const alignClass = (align) => align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const busy = loading || remoteLoading;
  const showEmpty = !busy && pageRows.length === 0;
  const linkAttrs = useMemo5(
    () => source ? sourceLinkAttrs(source) : rowsLinkAttrs(rows),
    [rows, source]
  );
  const columnCount = columns.length + (rowActions?.length ? 1 : 0) + (selectable ? 1 : 0);
  const offerAllMatching = selectable && pageAllSelected && !allMatching && total > pageKeys.length && paging;
  return /* @__PURE__ */ jsxs43("div", { className: cn("text-left", className), ...linkAttrs, children: [
    (filterable || exportable) && /* @__PURE__ */ jsx48(
      Toolbar,
      {
        className: "mb-3",
        end: exportable ? /* @__PURE__ */ jsx48(
          Button,
          {
            variant: "secondary",
            size: "sm",
            icon: "download",
            loading: exporting,
            onClick: () => void exportCsv(),
            children: "Export CSV"
          }
        ) : void 0,
        children: filterable && /* @__PURE__ */ jsx48(
          SearchInput,
          {
            label: filterPlaceholder,
            placeholder: filterPlaceholder,
            value: filter,
            onChange: (v) => {
              setFilter(v);
              setPage(0);
            }
          }
        )
      }
    ),
    selectable && selectionCount > 0 && /* @__PURE__ */ jsxs43(
      "div",
      {
        role: "region",
        "aria-label": "Selected rows",
        "data-rm-action": bulkNames,
        className: cn("mb-3 flex flex-wrap items-center gap-2 border px-3 py-2", tk.radius, mutedBar),
        children: [
          /* @__PURE__ */ jsx48("span", { className: cn("text-sm font-medium", tk.fg), children: allMatching ? `All ${total} selected` : `${selectionCount} selected` }),
          offerAllMatching && /* @__PURE__ */ jsxs43(
            "button",
            {
              type: "button",
              onClick: selectAllMatching,
              className: cn("rounded text-sm font-medium underline underline-offset-2", tk.fgPrimary, focusRing),
              children: [
                "Select all ",
                total
              ]
            }
          ),
          /* @__PURE__ */ jsxs43("div", { className: "ml-auto flex flex-wrap items-center gap-2", children: [
            (bulkActions ?? []).map((a) => /* @__PURE__ */ jsx48(
              Button,
              {
                size: "sm",
                variant: a.danger ? "danger" : "secondary",
                disabled: a.disabled?.(selection) ?? false,
                "data-rm-action": isLinkedBulk(a) ? a.action.name : void 0,
                loading: isLinkedBulk(a) ? a.action.loading : void 0,
                onClick: () => runBulk(a),
                children: a.label
              },
              a.label
            )),
            /* @__PURE__ */ jsx48(Button, { size: "sm", variant: "ghost", onClick: clearSelection, children: "Clear" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx48("div", { className: cn("overflow-hidden", cardBase), children: /* @__PURE__ */ jsx48("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs43("table", { className: "w-full border-collapse text-sm", children: [
      caption && /* @__PURE__ */ jsx48("caption", { className: "sr-only", children: caption }),
      /* @__PURE__ */ jsx48("thead", { children: /* @__PURE__ */ jsxs43("tr", { className: cn("border-b", mutedBar), children: [
        selectable && /* @__PURE__ */ jsx48("th", { scope: "col", className: "w-10 px-3 py-2.5", children: /* @__PURE__ */ jsx48(
          TickBox,
          {
            label: "Select every row on this page",
            checked: pageAllSelected,
            indeterminate: pageSomeSelected,
            onChange: togglePage
          }
        ) }),
        columns.map((col) => {
          const active = sortKey === col.key;
          return /* @__PURE__ */ jsx48(
            "th",
            {
              scope: "col",
              "aria-sort": active ? sortDir === "asc" ? "ascending" : "descending" : void 0,
              className: cn(
                "whitespace-nowrap px-3 py-2.5 text-xs font-medium",
                tk.fgMuted,
                alignClass(col.align),
                col.className
              ),
              children: col.sortable ? /* @__PURE__ */ jsxs43(
                "button",
                {
                  type: "button",
                  onClick: () => toggleSort(col),
                  className: cn(
                    "inline-flex items-center gap-1 rounded transition-colors",
                    tk.hoverFg,
                    focusRing,
                    active && tk.fg
                  ),
                  children: [
                    col.header,
                    /* @__PURE__ */ jsx48(SortIcon, { active, dir: sortDir })
                  ]
                }
              ) : col.header
            },
            col.key
          );
        }),
        rowActions && rowActions.length > 0 && /* @__PURE__ */ jsx48("th", { scope: "col", className: "w-12 px-3 py-2.5", children: /* @__PURE__ */ jsx48("span", { className: "sr-only", children: "Actions" }) })
      ] }) }),
      /* @__PURE__ */ jsxs43("tbody", { children: [
        busy && // The shape of the rows that are coming, not a word in the
        // middle of an empty box; the word is still there for a
        // screen reader.
        LOADING_ROWS.map((n) => /* @__PURE__ */ jsx48("tr", { className: cn("border-b last:border-b-0", tk.border), "aria-hidden": n > 0 || void 0, children: /* @__PURE__ */ jsxs43("td", { colSpan: columnCount, className: "px-3 py-3", children: [
          n === 0 && /* @__PURE__ */ jsx48("span", { className: "sr-only", children: "Loading" }),
          /* @__PURE__ */ jsx48(Skeleton, { variant: "text", width: n % 2 === 0 ? "70%" : "45%" })
        ] }) }, n)),
        !busy && pageRows.map((row, i) => {
          const key = keyOf(row, i);
          const ticked = allMatching || keySet.has(key);
          return /* @__PURE__ */ jsxs43(
            "tr",
            {
              onClick: onRowClick ? () => onRowClick(row) : void 0,
              "aria-selected": selectable ? ticked : void 0,
              className: cn(
                "border-b last:border-b-0",
                tk.border,
                interactiveRow,
                onRowClick && "cursor-pointer",
                ticked && tk.selectedBgPrimarySoft
              ),
              children: [
                selectable && /* @__PURE__ */ jsx48("td", { className: "px-3 py-2.5", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx48(
                  TickBox,
                  {
                    label: `Select row ${i + 1}`,
                    checked: ticked,
                    onChange: () => toggleRow(key)
                  }
                ) }),
                columns.map((col) => /* @__PURE__ */ jsx48(
                  "td",
                  {
                    className: cn("px-3 py-2.5", tk.fg, alignClass(col.align), col.className),
                    children: col.render ? col.render(row) : cellText(defaultValue(row, col))
                  },
                  col.key
                )),
                rowActions && rowActions.length > 0 && /* @__PURE__ */ jsx48("td", { className: "px-2 py-1.5 text-right", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx48(Menu, { items: rowMenuItems(row, rowActions, afterOwnWrite) }) })
              ]
            },
            key
          );
        }),
        showEmpty && /* @__PURE__ */ jsx48("tr", { children: /* @__PURE__ */ jsx48("td", { colSpan: columnCount, className: "p-0", children: remoteError ? /* @__PURE__ */ jsx48(ErrorState, { className: "m-3", error: remoteError, onRetry: refresh }) : emptyState ?? /* @__PURE__ */ jsx48(
          EmptyState,
          {
            className: "rounded-none border-0",
            title: emptyTitle,
            description: emptyDescription ?? (filter ? "No rows match the current filter." : void 0)
          }
        ) }) })
      ] })
    ] }) }) }),
    paging && total > effPageSize && /* @__PURE__ */ jsx48(
      Pagination,
      {
        className: "mt-3",
        page: clampedPage + 1,
        pageCount,
        onChange: (p) => setPage(p - 1),
        total,
        pageSize: effPageSize,
        noun: "rows"
      }
    ),
    exporting && /* @__PURE__ */ jsx48("span", { className: "sr-only", role: "status", children: "Preparing the export" })
  ] });
}
var LOADING_ROWS = [0, 1, 2];
function TickBox({
  label,
  checked,
  indeterminate = false,
  onChange
}) {
  const ref = useRef18(null);
  useEffect19(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return /* @__PURE__ */ jsx48(
    "input",
    {
      ref,
      type: "checkbox",
      "aria-label": label,
      checked,
      onChange,
      className: cn(
        "h-4 w-4 cursor-pointer rounded accent-[color:oklch(var(--rm-primary))]",
        tk.borderInput,
        tk.fgPrimary,
        focusRing
      )
    }
  );
}
function rowMenuItems(row, actions, onWrite) {
  return actions.map((a) => ({
    label: a.label,
    danger: a.danger,
    disabled: a.disabled?.(row) ?? false,
    action: isLinkedAction(a) ? {
      name: a.action.name,
      loading: a.action.loading,
      error: a.action.error,
      run: (params) => Promise.resolve(a.action.run(params)).then((r) => {
        onWrite();
        return r;
      })
    } : void 0,
    params: isLinkedAction(a) ? a.params(row) : void 0,
    onSelect: isLinkedAction(a) ? void 0 : () => a.onSelect(row)
  }));
}
var RUNAWAY_MESSAGE = "This list asked the robot the same question over and over, so it stopped. The screen is most likely rebuilding the list while it is still loading.";
var RUNAWAY_WINDOW_MS = 2e3;
var RUNAWAY_LIMIT = 20;
var recentFetches = /* @__PURE__ */ new Map();
function noteSourceFetch(name, now = Date.now()) {
  const hits = (recentFetches.get(name) ?? []).filter((t) => now - t < RUNAWAY_WINDOW_MS);
  hits.push(now);
  recentFetches.set(name, hits);
  return hits.length > RUNAWAY_LIMIT;
}
function clearSourceFetches(name) {
  recentFetches.delete(name);
}
function toCsv(columns, rows) {
  const cell = (v) => {
    if (v === null || v === void 0) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => cell(typeof c.header === "string" ? c.header : c.key));
  const body = rows.map((row) => columns.map((c) => cell(defaultValue(row, c))));
  return [header, ...body].map((r) => r.join(",")).join("\r\n");
}
function downloadCsv(filename, csv) {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return;
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function cellText(v) {
  if (v === null || v === void 0 || v === "") {
    return /* @__PURE__ */ jsx48("span", { className: tk.fgFaint, children: "-" });
  }
  return String(v);
}
function SortIcon({ active, dir }) {
  return /* @__PURE__ */ jsx48(
    Icon,
    {
      name: !active ? "chevrons-up-down" : dir === "asc" ? "chevron-up" : "chevron-down",
      size: 12,
      strokeWidth: 2.5,
      className: active ? "opacity-100" : "opacity-40"
    }
  );
}

// src/components/kanban.tsx
import {
  Children as Children7,
  createContext as createContext5,
  isValidElement as isValidElement5,
  useContext as useContext6,
  useEffect as useEffect20,
  useRef as useRef19,
  useState as useState27
} from "react";
import { jsx as jsx49, jsxs as jsxs44 } from "react/jsx-runtime";
var KanbanContext = createContext5(null);
function Kanban({ onMove, action, className, children }) {
  const items2 = Children7.toArray(children);
  const columns = [];
  for (const c of items2) {
    if (isValidElement5(c) && c.type === KanbanColumn) columns.push(String(c.props.id));
  }
  const [dragKey, setDragKey] = useState27(null);
  const [dragFrom, setDragFrom] = useState27(null);
  const [dragOffset, setDragOffset] = useState27({ x: 0, y: 0 });
  const [overColumn, setOverColumn] = useState27(null);
  const origin = useRef19({ x: 0, y: 0 });
  const latest = useRef19({
    key: "",
    from: "",
    over: null
  });
  const move = (key, from, to) => {
    if (!key || !to || from === to) return;
    const m = { key, from, to };
    onMove?.(m);
    if (action) void runAction(action, m).catch(() => void 0);
  };
  const startDrag = (key, from, at) => {
    origin.current = at;
    latest.current = { key, from, over: null };
    setDragKey(key);
    setDragFrom(from);
    setDragOffset({ x: 0, y: 0 });
    setOverColumn(null);
  };
  useEffect20(() => {
    if (!dragKey) return;
    const onPointerMove = (e) => {
      setDragOffset({ x: e.clientX - origin.current.x, y: e.clientY - origin.current.y });
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const col = el?.closest("[data-rm-kanban-column]")?.getAttribute("data-rm-kanban-column") ?? null;
      latest.current.over = col;
      setOverColumn(col);
    };
    const finish = () => {
      const { key, from, over } = latest.current;
      if (over) move(key, from, over);
      setDragKey(null);
      setDragFrom(null);
      setOverColumn(null);
      setDragOffset({ x: 0, y: 0 });
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [dragKey]);
  const ctx = {
    columns,
    dragKey,
    dragFrom,
    dragOffset,
    overColumn,
    startDrag,
    move
  };
  return /* @__PURE__ */ jsx49(KanbanContext.Provider, { value: ctx, children: /* @__PURE__ */ jsx49(
    "div",
    {
      className: cn("flex gap-4 overflow-x-auto pb-2 text-left", className),
      "data-rm-action": action?.name,
      children: items2
    }
  ) });
}
function KanbanColumn({ id, title, meta, emptyState, className, children }) {
  const ctx = useContext6(KanbanContext);
  const over = ctx?.overColumn === id && ctx?.dragFrom !== id;
  const cards = Children7.toArray(children);
  return /* @__PURE__ */ jsxs44(
    "section",
    {
      "data-rm-kanban-column": id,
      "aria-label": typeof title === "string" ? title : void 0,
      className: cn(
        "flex w-72 shrink-0 flex-col border transition-colors",
        tk.radius,
        over ? cn(tk.borderPrimary, tk.selectedBgPrimarySoft) : cn(tk.border, tk.bgMutedHalf),
        className
      ),
      children: [
        /* @__PURE__ */ jsxs44("header", { className: "flex items-center justify-between gap-2 px-3 py-2", children: [
          /* @__PURE__ */ jsx49("h3", { className: cn("min-w-0 truncate", textStyles.cardTitle), children: title }),
          /* @__PURE__ */ jsx49("span", { className: cn("shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums", tk.bgMuted, tk.fgMuted), children: meta ?? cards.length })
        ] }),
        /* @__PURE__ */ jsx49("ul", { className: "flex min-h-[4rem] flex-1 flex-col gap-2 p-2", children: cards.length > 0 ? cards : /* @__PURE__ */ jsx49("li", { className: cn("border border-dashed px-3 py-6 text-center text-xs", tk.radiusMd, tk.borderInput, tk.fgMuted), children: emptyState ?? "Nothing here" }) })
      ]
    }
  );
}
function KanbanCard({ id, column, disabled = false, className, children }) {
  const ctx = useContext6(KanbanContext);
  const ref = useRef19(null);
  const dragging = ctx?.dragKey === id;
  const onPointerDown = (e) => {
    if (disabled || e.button !== 0) return;
    const owner = column ?? columnOf(e.currentTarget) ?? "";
    if (!owner) return;
    ctx?.startDrag(id, owner, { x: e.clientX, y: e.clientY });
  };
  const onKeyDown = (e) => {
    if (disabled || !ctx) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const owner = column ?? columnOf(e.currentTarget) ?? "";
    const i = ctx.columns.indexOf(owner);
    if (i < 0) return;
    const next = ctx.columns[i + (e.key === "ArrowRight" ? 1 : -1)];
    if (!next) return;
    e.preventDefault();
    ctx.move(id, owner, next);
  };
  return /* @__PURE__ */ jsx49(
    "li",
    {
      ref,
      "data-rm-kanban-card": id,
      tabIndex: disabled ? -1 : 0,
      "aria-grabbed": dragging || void 0,
      onPointerDown,
      onKeyDown,
      style: dragging ? {
        transform: `translate(${ctx?.dragOffset.x ?? 0}px, ${ctx?.dragOffset.y ?? 0}px)`,
        pointerEvents: "none"
      } : void 0,
      className: cn(
        "relative p-3 text-sm",
        cardBase,
        tk.radiusMd,
        interactiveRow,
        disabled ? "cursor-not-allowed opacity-60" : "cursor-grab",
        dragging && cn("z-50 rotate-1 cursor-grabbing opacity-50", tk.shadowLg),
        focusRing,
        className
      ),
      children
    }
  );
}
function columnOf(el) {
  return el?.closest("[data-rm-kanban-column]")?.getAttribute("data-rm-kanban-column") ?? null;
}

// src/components/calendar.tsx
import { useMemo as useMemo6, useState as useState28 } from "react";
import { Fragment as Fragment15, jsx as jsx50, jsxs as jsxs45 } from "react/jsx-runtime";
function iso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function parseMonth(value, fallback) {
  const m = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!m) return { year: fallback.getFullYear(), month: fallback.getMonth() };
  return { year: Number(m[1]), month: Number(m[2]) - 1 };
}
function Calendar({
  month,
  defaultMonth,
  onMonthChange,
  events = [],
  selected,
  onSelect,
  weekStartsOn = "monday",
  maxPerDay = 2,
  className
}) {
  const today = /* @__PURE__ */ new Date();
  const [ownMonth, setOwnMonth] = useState28(
    defaultMonth ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );
  const current = month ?? ownMonth;
  const { year, month: monthIndex } = parseMonth(current, today);
  const goto = (delta) => {
    const d = new Date(year, monthIndex + delta, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (month === void 0) setOwnMonth(next);
    onMonthChange?.(next);
  };
  const byDate = useMemo6(() => {
    const map = /* @__PURE__ */ new Map();
    for (const e of events) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [events]);
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const shift3 = weekStartsOn === "monday" ? 1 : 0;
  const lead = (firstDay.getDay() - shift3 + 7) % 7;
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + i + shift3);
    return d.toLocaleDateString(void 0, { weekday: "short" });
  });
  const heading = firstDay.toLocaleDateString(void 0, { month: "long", year: "numeric" });
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());
  return /* @__PURE__ */ jsxs45("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsxs45("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx50(NavButton, { label: "Previous month", onClick: () => goto(-1), dir: "prev" }),
      /* @__PURE__ */ jsx50("h3", { className: textStyles.cardTitle, children: heading }),
      /* @__PURE__ */ jsx50(NavButton, { label: "Next month", onClick: () => goto(1), dir: "next" })
    ] }),
    /* @__PURE__ */ jsxs45(
      "div",
      {
        role: "group",
        "aria-label": heading,
        className: cn("overflow-hidden border", tk.radius, tk.border, tk.bgCard),
        children: [
          /* @__PURE__ */ jsx50("div", { "aria-hidden": "true", className: cn("grid grid-cols-7 border-b", tk.border, tk.bgMutedHalf), children: weekdays.map((w) => /* @__PURE__ */ jsx50("div", { className: cn("px-2 py-1.5 text-center text-xs font-medium", tk.fgMuted), children: w }, w)) }),
          /* @__PURE__ */ jsx50("div", { className: "grid grid-cols-7", children: cells.map((day, i) => {
            if (day === null) {
              return /* @__PURE__ */ jsx50(
                "div",
                {
                  className: cn("min-h-[4.5rem] border-b border-r last:border-r-0", tk.border, tk.bgMutedHalf)
                },
                `pad-${i}`
              );
            }
            const date = iso(year, monthIndex, day);
            const dayEvents = byDate.get(date) ?? [];
            const isSelected = selected === date;
            const isToday = date === todayIso;
            const body = /* @__PURE__ */ jsxs45(Fragment15, { children: [
              /* @__PURE__ */ jsx50(
                "span",
                {
                  className: cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs tabular-nums",
                    isSelected && cn("font-semibold", tk.bgPrimary, tk.fgOnPrimary),
                    !isSelected && isToday && cn("font-semibold", tk.fgPrimary),
                    !isSelected && !isToday && tk.fgMuted
                  ),
                  children: day
                }
              ),
              /* @__PURE__ */ jsxs45("span", { className: "mt-1 flex flex-col gap-0.5", children: [
                dayEvents.slice(0, maxPerDay).map((e, j) => /* @__PURE__ */ jsx50(
                  "span",
                  {
                    className: cn("truncate px-1 py-0.5 text-[11px] font-medium", tk.radiusSm, tk.bgPrimarySoft, tk.fgPrimary),
                    children: e.label
                  },
                  j
                )),
                dayEvents.length > maxPerDay && /* @__PURE__ */ jsxs45("span", { className: cn("px-1 text-[11px]", tk.fgMuted), children: [
                  "+",
                  dayEvents.length - maxPerDay,
                  " more"
                ] })
              ] })
            ] });
            const cellClass = cn(
              "flex min-h-[4.5rem] flex-col border-b border-r p-1.5 text-left last:border-r-0",
              tk.border,
              isSelected && tk.selectedBgPrimarySoft
            );
            if (!onSelect) {
              return /* @__PURE__ */ jsx50("div", { className: cellClass, children: body }, date);
            }
            const fullDate = new Date(year, monthIndex, day).toLocaleDateString(void 0, {
              dateStyle: "full"
            });
            return /* @__PURE__ */ jsx50(
              "button",
              {
                type: "button",
                "aria-pressed": isSelected,
                onClick: () => onSelect(date, dayEvents),
                "aria-label": `${fullDate}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`,
                className: cn(cellClass, "transition-colors", tk.hoverBgMutedHalf, focusRing),
                children: body
              },
              date
            );
          }) })
        ]
      }
    )
  ] });
}
function NavButton({ label, onClick, dir }) {
  return /* @__PURE__ */ jsx50("button", { type: "button", "aria-label": label, onClick, className: cn("p-1.5", ghostControl, focusRing), children: /* @__PURE__ */ jsx50(Icon, { name: dir === "prev" ? "chevron-left" : "chevron-right", size: 16 }) });
}

// src/components/json-view.tsx
import { useState as useState29 } from "react";
import { jsx as jsx51, jsxs as jsxs46 } from "react/jsx-runtime";
function isEmpty2(value) {
  if (value === void 0 || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
function JsonView({
  value,
  maxDepth = 2,
  copyable = true,
  emptyState,
  label = "Result",
  className
}) {
  const [copied, setCopied] = useState29(false);
  if (isEmpty2(value)) {
    return /* @__PURE__ */ jsx51(
      "div",
      {
        className: cn("border border-dashed px-4 py-6 text-center text-sm", tk.radiusMd, tk.borderInput, tk.fgMuted, className),
        children: emptyState ?? "Nothing came back."
      }
    );
  }
  const copy = () => {
    try {
      void navigator.clipboard?.writeText(JSON.stringify(value, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs46(
    "div",
    {
      className: cn(
        "relative border p-3 text-left leading-relaxed",
        tk.radiusMd,
        tk.border,
        tk.bgMutedHalf,
        tk.fg,
        textStyles.mono,
        className
      ),
      children: [
        copyable && /* @__PURE__ */ jsxs46(
          "button",
          {
            type: "button",
            onClick: copy,
            "aria-label": copied ? "Copied" : "Copy as JSON",
            className: cn(
              "absolute right-2 top-2 inline-flex items-center gap-1 border px-1.5 py-0.5 font-sans text-[11px] transition-colors",
              tk.radiusSm,
              tk.border,
              tk.bgCard,
              tk.fgMuted,
              tk.hoverBgMuted,
              tk.hoverFg,
              focusRing
            ),
            children: [
              /* @__PURE__ */ jsx51(Icon, { name: copied ? "check" : "copy", size: 12 }),
              copied ? "Copied" : "Copy"
            ]
          }
        ),
        /* @__PURE__ */ jsx51("ul", { role: "tree", "aria-label": label, className: cn("m-0 list-none p-0", copyable && "pr-16"), children: /* @__PURE__ */ jsx51(Node2, { name: null, value, depth: 0, maxDepth }) })
      ]
    }
  );
}
function Node2({
  name,
  value,
  depth,
  maxDepth
}) {
  const branch = value !== null && typeof value === "object";
  const [open, setOpen] = useState29(depth < maxDepth);
  if (!branch) {
    return /* @__PURE__ */ jsxs46("li", { role: "treeitem", className: "whitespace-pre-wrap break-words", children: [
      name !== null && /* @__PURE__ */ jsx51(Key, { name }),
      /* @__PURE__ */ jsx51(Leaf, { value })
    ] });
  }
  const array = Array.isArray(value);
  const entries = array ? value.map((v, i) => [String(i), v]) : Object.entries(value);
  const summary = array ? `[${entries.length} ${entries.length === 1 ? "item" : "items"}]` : `{${entries.length} ${entries.length === 1 ? "field" : "fields"}}`;
  return /* @__PURE__ */ jsxs46("li", { role: "treeitem", "aria-expanded": open, children: [
    /* @__PURE__ */ jsxs46(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        className: cn("inline-flex max-w-full items-center gap-1 rounded text-left", tk.fgMuted, tk.hoverFg, focusRing),
        children: [
          /* @__PURE__ */ jsx51(Icon, { name: "chevron-right", size: 12, className: cn("transition-transform", open && "rotate-90") }),
          name !== null ? /* @__PURE__ */ jsx51(Key, { name }) : null,
          /* @__PURE__ */ jsx51("span", { className: tk.fgFaint, children: summary })
        ]
      }
    ),
    open && /* @__PURE__ */ jsx51("ul", { role: "group", className: cn("m-0 list-none border-l pl-3", tk.border), children: entries.map(([key, v]) => /* @__PURE__ */ jsx51(Node2, { name: key, value: v, depth: depth + 1, maxDepth }, key)) })
  ] });
}
function Key({ name }) {
  return /* @__PURE__ */ jsxs46("span", { className: tk.fgMuted, children: [
    name,
    ": "
  ] });
}
function Leaf({ value }) {
  if (typeof value === "string") {
    return /* @__PURE__ */ jsxs46("span", { className: tk.fgSuccess, children: [
      '"',
      value,
      '"'
    ] });
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return /* @__PURE__ */ jsx51("span", { className: tk.fgInfo, children: String(value) });
  }
  if (typeof value === "boolean") {
    return /* @__PURE__ */ jsx51("span", { className: tk.fgWarning, children: String(value) });
  }
  if (value === null) return /* @__PURE__ */ jsx51("span", { className: tk.fgWarning, children: "null" });
  if (value === void 0) return /* @__PURE__ */ jsx51("span", { className: tk.fgFaint, children: "-" });
  return /* @__PURE__ */ jsx51("span", { className: tk.fg, children: String(value) });
}

// src/components/form.tsx
import {
  createContext as createContext6,
  useCallback as useCallback10,
  useContext as useContext7,
  useEffect as useEffect21,
  useId as useId12,
  useMemo as useMemo7,
  useRef as useRef20,
  useState as useState30
} from "react";
import { Fragment as Fragment16, jsx as jsx52, jsxs as jsxs47 } from "react/jsx-runtime";
var FormContext = createContext6(null);
var FieldContext = createContext6(null);
var FORMATS = {
  email: {
    ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: "Enter an email address."
  },
  uri: {
    ok: (v) => /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s]+$/.test(v),
    message: "Enter a web address, starting with http:// or https://."
  },
  date: {
    ok: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)),
    message: "Enter a date."
  },
  "date-time": {
    ok: (v) => !Number.isNaN(Date.parse(v)),
    message: "Enter a date and a time."
  },
  time: {
    ok: (v) => /^\d{2}:\d{2}(:\d{2})?$/.test(v),
    message: "Enter a time."
  }
};
function isEmpty3(value) {
  if (value === void 0 || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
function checkValue(prop, value) {
  if (prop.enum && !prop.enum.some((v) => v === value)) return "Pick one of the allowed values.";
  switch (prop.type) {
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) return "Enter a number.";
      break;
    case "integer":
      if (typeof value !== "number" || !Number.isInteger(value)) return "Enter a whole number.";
      break;
    case "boolean":
      if (typeof value !== "boolean") return "This must be on or off.";
      break;
    case "string":
      if (typeof value !== "string") return "Enter text.";
      break;
    default:
      break;
  }
  if (prop.format && typeof value === "string") {
    const f = FORMATS[prop.format];
    if (f && !f.ok(value)) return f.message;
  }
  return void 0;
}
function validateObject(schema, values, prefix, errors) {
  if (!schema || schema.type !== "object" || !schema.properties) return;
  const required = new Set(schema.required ?? []);
  for (const [name, prop] of Object.entries(schema.properties)) {
    const key = prefix + name;
    const value = values[name];
    if (isEmpty3(value)) {
      if (required.has(name)) errors[key] = "This field is required.";
      continue;
    }
    if (prop.type === "array") {
      if (!Array.isArray(value)) {
        errors[key] = "This must be a list.";
        continue;
      }
      const item = prop.items;
      if (!item) continue;
      value.forEach((row, i) => {
        if (item.type === "object") {
          validateObject(item, row ?? {}, `${key}.${i}.`, errors);
          return;
        }
        if (isEmpty3(row)) {
          errors[`${key}.${i}`] = "This field is required.";
          return;
        }
        const message2 = checkValue(item, row);
        if (message2) errors[`${key}.${i}`] = message2;
      });
      continue;
    }
    if (prop.type === "object") {
      validateObject(prop, value ?? {}, `${key}.`, errors);
      continue;
    }
    const message = checkValue(prop, value);
    if (message) errors[key] = message;
  }
}
function validateAgainstSchema(schema, values) {
  const errors = {};
  validateObject(schema, values, "", errors);
  return errors;
}
function submitControlOf(form) {
  const candidates = form.querySelectorAll("button,input");
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const type = c.getAttribute("type");
    if (c.tagName === "INPUT" ? type === "submit" : (type ?? "submit") === "submit") return c;
  }
  return null;
}
function Form({
  schema,
  initialValues,
  values: controlledValues,
  onChange,
  onSubmit,
  action,
  disabled = false,
  hideError = false,
  children,
  className,
  ...props
}) {
  const [ownValues, setOwnValues] = useState30(initialValues ?? {});
  const [errors, setErrors] = useState30({});
  const values = controlledValues ?? ownValues;
  const formRef = useRef20(null);
  useEffect21(() => {
    const form = formRef.current;
    if (!form || !action) return;
    const target = submitControlOf(form) ?? form;
    const current = (target.getAttribute("data-rm-action") ?? "").split(/\s+/).filter(Boolean);
    if (!current.includes(action.name)) {
      target.setAttribute("data-rm-action", [...current, action.name].join(" "));
    }
  });
  const latest = useRef20(values);
  latest.current = values;
  const setValue = useCallback10(
    (name, value) => {
      const next = { ...latest.current, [name]: value };
      latest.current = next;
      if (controlledValues === void 0) setOwnValues(next);
      onChange?.(next);
      setErrors((prev) => {
        if (!(name in prev)) return prev;
        const rest = { ...prev };
        delete rest[name];
        return rest;
      });
    },
    [controlledValues, onChange]
  );
  const ctx = useMemo7(
    () => ({ values, errors, disabled, setValue }),
    [values, errors, disabled, setValue]
  );
  return /* @__PURE__ */ jsx52(FormContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs47(
    "form",
    {
      ref: formRef,
      noValidate: true,
      className: cn("flex flex-col gap-4 text-left", className),
      onSubmit: (e) => {
        e.preventDefault();
        const nextErrors = validateAgainstSchema(schema, values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length === 0) {
          let ranInSubmit = false;
          const originalRun = action?.run;
          if (action && originalRun) {
            action.run = ((params) => {
              ranInSubmit = true;
              return runAction(
                { ...action, run: (p) => originalRun.call(action, p) },
                params
              );
            });
          }
          try {
            void onSubmit?.(values);
          } finally {
            if (action && originalRun) action.run = originalRun;
          }
          if (action && !ranInSubmit) void runAction(action, values).catch(() => void 0);
        }
      },
      ...props,
      children: [
        children,
        !hideError && action?.error ? /* @__PURE__ */ jsx52(ErrorState, { error: action.error, className: "mt-3" }) : null
      ]
    }
  ) });
}
function useFormValues() {
  return useContext7(FormContext)?.values ?? {};
}
function Field({ name, label, help, required = false, error, className, children }) {
  const form = useContext7(FormContext);
  const id = useId12();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const shownError = error ?? form?.errors[name];
  const describedBy = [help !== void 0 ? helpId : null, shownError ? errorId : null].filter(Boolean).join(" ") || void 0;
  const ctx = useMemo7(
    () => ({ name, id, describedBy, invalid: Boolean(shownError), required }),
    [name, id, describedBy, shownError, required]
  );
  return /* @__PURE__ */ jsx52(FieldContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs47("div", { className: cn("flex flex-col gap-1.5", className), children: [
    /* @__PURE__ */ jsxs47("label", { htmlFor: id, className: cn("text-sm font-medium", tk.fg), children: [
      label,
      required && /* @__PURE__ */ jsx52("span", { "aria-hidden": "true", className: cn("ml-0.5", tk.fgDestructive), children: "*" })
    ] }),
    children,
    help !== void 0 && /* @__PURE__ */ jsx52("p", { id: helpId, className: cn("text-xs", tk.fgMuted), children: help }),
    shownError && /* @__PURE__ */ jsx52("p", { id: errorId, className: cn("text-xs font-medium", tk.fgDestructive), children: shownError })
  ] }) });
}
function useControl(explicitId) {
  const form = useContext7(FormContext);
  const field = useContext7(FieldContext);
  const fallbackId = useId12();
  return {
    form,
    field,
    id: explicitId ?? field?.id ?? fallbackId,
    ariaProps: {
      "aria-invalid": field?.invalid || void 0,
      "aria-describedby": field?.describedBy,
      "aria-required": field?.required || void 0
    },
    read() {
      return field && form ? form.values[field.name] : void 0;
    },
    write(value) {
      if (field && form) form.setValue(field.name, value);
    },
    disabled: form?.disabled ?? false
  };
}
function TextInput({ value, onChange, className, id, disabled, type = "text", ...props }) {
  const c = useControl(id);
  const current = value ?? c.read() ?? "";
  return /* @__PURE__ */ jsx52(
    "input",
    {
      id: c.id,
      type,
      className: cn(inputBase, className),
      value: current,
      disabled: disabled || c.disabled,
      onChange: (e) => {
        onChange?.(e.target.value);
        c.write(e.target.value);
      },
      ...c.ariaProps,
      ...props
    }
  );
}
function NumberInput({ value, onChange, className, id, disabled, ...props }) {
  const c = useControl(id);
  const current = value ?? c.read();
  return /* @__PURE__ */ jsx52(
    "input",
    {
      id: c.id,
      type: "number",
      inputMode: "decimal",
      className: cn(inputBase, className),
      value: current ?? "",
      disabled: disabled || c.disabled,
      onChange: (e) => {
        const raw = e.target.value;
        const parsed = raw === "" ? void 0 : Number(raw);
        onChange?.(parsed);
        c.write(parsed);
      },
      ...c.ariaProps,
      ...props
    }
  );
}
function TextArea({ value, onChange, className, id, disabled, rows = 4, ...props }) {
  const c = useControl(id);
  const current = value ?? c.read() ?? "";
  return /* @__PURE__ */ jsx52(
    "textarea",
    {
      id: c.id,
      rows,
      className: cn(inputBase, "min-h-[80px] resize-y", className),
      value: current,
      disabled: disabled || c.disabled,
      onChange: (e) => {
        onChange?.(e.target.value);
        c.write(e.target.value);
      },
      ...c.ariaProps,
      ...props
    }
  );
}
function Select({
  options,
  value,
  onChange,
  placeholder,
  className,
  id,
  disabled,
  ...props
}) {
  const c = useControl(id);
  const bound = c.read();
  const firstEnabled = placeholder === void 0 ? options.find((o) => !o.disabled)?.value : void 0;
  const seed = bound === void 0 ? value !== void 0 && value !== "" ? value : firstEnabled : void 0;
  const current = value ?? bound ?? firstEnabled ?? "";
  const write = c.write;
  useEffect21(() => {
    if (seed !== void 0) write(seed);
  }, [seed]);
  return /* @__PURE__ */ jsxs47(
    "select",
    {
      id: c.id,
      className: cn(inputBase, "pr-8", className),
      value: current,
      disabled: disabled || c.disabled,
      onChange: (e) => {
        onChange?.(e.target.value);
        c.write(e.target.value);
      },
      ...c.ariaProps,
      ...props,
      children: [
        placeholder !== void 0 && /* @__PURE__ */ jsx52("option", { value: "", disabled: true, children: placeholder }),
        options.map((opt) => /* @__PURE__ */ jsx52("option", { value: opt.value, disabled: opt.disabled, children: opt.label }, opt.value))
      ]
    }
  );
}
function Checkbox({ checked, onChange, label, className, id, disabled, ...props }) {
  const c = useControl(id);
  const current = checked ?? Boolean(c.read());
  return /* @__PURE__ */ jsxs47(
    "label",
    {
      className: cn(
        "inline-flex cursor-pointer select-none items-center gap-2 text-sm",
        tk.fg,
        (disabled || c.disabled) && "cursor-not-allowed opacity-60",
        className
      ),
      children: [
        /* @__PURE__ */ jsx52(
          "input",
          {
            id: c.id,
            type: "checkbox",
            className: cn(
              "h-4 w-4 rounded accent-[color:oklch(var(--rm-primary))]",
              tk.borderInput,
              focusRing
            ),
            checked: current,
            disabled: disabled || c.disabled,
            onChange: (e) => {
              onChange?.(e.target.checked);
              c.write(e.target.checked);
            },
            ...c.ariaProps,
            ...props
          }
        ),
        label
      ]
    }
  );
}
function RadioGroup({ options, value, onChange, name, className, disabled }) {
  const c = useControl();
  const groupName = name ?? c.field?.name ?? c.id;
  const current = value ?? c.read() ?? "";
  return /* @__PURE__ */ jsx52(
    "div",
    {
      role: "radiogroup",
      "aria-describedby": c.ariaProps["aria-describedby"],
      "aria-invalid": c.ariaProps["aria-invalid"],
      className: cn("flex flex-col gap-2", className),
      children: options.map((opt) => /* @__PURE__ */ jsxs47(
        "label",
        {
          className: cn(
            "inline-flex cursor-pointer select-none items-center gap-2 text-sm",
            tk.fg,
            (disabled || c.disabled || opt.disabled) && "cursor-not-allowed opacity-60"
          ),
          children: [
            /* @__PURE__ */ jsx52(
              "input",
              {
                type: "radio",
                name: groupName,
                value: opt.value,
                checked: current === opt.value,
                disabled: disabled || c.disabled || opt.disabled,
                onChange: () => {
                  onChange?.(opt.value);
                  c.write(opt.value);
                },
                className: cn(
                  "h-4 w-4 accent-[color:oklch(var(--rm-primary))]",
                  tk.borderInput,
                  focusRing
                )
              }
            ),
            opt.label
          ]
        },
        opt.value
      ))
    }
  );
}
function DatePicker({ value, onChange, className, id, disabled, ...props }) {
  const c = useControl(id);
  const current = value ?? c.read() ?? "";
  return /* @__PURE__ */ jsx52(
    "input",
    {
      id: c.id,
      type: "date",
      className: cn(inputBase, className),
      value: current,
      disabled: disabled || c.disabled,
      onChange: (e) => {
        onChange?.(e.target.value);
        c.write(e.target.value);
      },
      ...c.ariaProps,
      ...props
    }
  );
}
function TimePicker({ value, onChange, className, id, disabled, ...props }) {
  const c = useControl(id);
  const current = value ?? c.read() ?? "";
  return /* @__PURE__ */ jsx52(
    "input",
    {
      id: c.id,
      type: "time",
      className: cn(inputBase, className),
      value: current,
      disabled: disabled || c.disabled,
      onChange: (e) => {
        onChange?.(e.target.value);
        c.write(e.target.value);
      },
      ...c.ariaProps,
      ...props
    }
  );
}
function FieldArray({
  name,
  label,
  help,
  newItem,
  addLabel = "Add another",
  min: min2 = 0,
  max: max2,
  reorder = true,
  emptyText = "Nothing added yet.",
  children,
  className
}) {
  const form = useContext7(FormContext);
  const helpId = useId12();
  const raw = form?.values[name];
  const rows = useMemo7(
    () => Array.isArray(raw) ? raw : [],
    [raw]
  );
  const disabled = form?.disabled ?? false;
  const arrayError = form?.errors[name];
  const write = (next) => form?.setValue(name, next);
  const add = () => write([...rows, newItem ? newItem() : {}]);
  const removeAt = (i) => write(rows.filter((_, at) => at !== i));
  const move = (i, delta) => {
    const to = i + delta;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [row] = next.splice(i, 1);
    next.splice(to, 0, row);
    write(next);
  };
  return /* @__PURE__ */ jsxs47("div", { className: cn("flex flex-col gap-2 text-left", className), children: [
    label !== void 0 && /* @__PURE__ */ jsx52("span", { className: cn("text-sm font-medium", tk.fg), children: label }),
    rows.length === 0 && /* @__PURE__ */ jsx52("p", { className: cn("border border-dashed px-3 py-4 text-center text-sm", tk.radiusMd, tk.borderInput, tk.fgMuted), children: emptyText }),
    rows.map((row, i) => /* @__PURE__ */ jsx52(
      FieldArrayRow,
      {
        form,
        arrayName: name,
        index: i,
        row,
        disabled,
        canRemove: !disabled && rows.length > min2,
        canMoveUp: reorder && !disabled && i > 0,
        canMoveDown: reorder && !disabled && i < rows.length - 1,
        onRemove: () => removeAt(i),
        onMove: (d) => move(i, d),
        children: children(row, i)
      },
      i
    )),
    help !== void 0 && /* @__PURE__ */ jsx52("p", { id: helpId, className: cn("text-xs", tk.fgMuted), children: help }),
    arrayError && /* @__PURE__ */ jsx52("p", { className: cn("text-xs font-medium", tk.fgDestructive), children: arrayError }),
    (max2 === void 0 || rows.length < max2) && /* @__PURE__ */ jsx52("div", { children: /* @__PURE__ */ jsx52(Button, { type: "button", variant: "secondary", size: "sm", disabled, onClick: add, children: addLabel }) })
  ] });
}
function FieldArrayRow({
  form,
  arrayName,
  index,
  row,
  disabled,
  canRemove,
  canMoveUp,
  canMoveDown,
  onRemove,
  onMove,
  children
}) {
  const prefix = `${arrayName}.${index}.`;
  const errors = useMemo7(() => {
    const out = {};
    for (const [key, message] of Object.entries(form?.errors ?? {})) {
      if (key.startsWith(prefix)) out[key.slice(prefix.length)] = message;
    }
    return out;
  }, [form?.errors, prefix]);
  const ctx = useMemo7(
    () => ({
      values: row,
      errors,
      disabled,
      setValue: (key, value) => {
        const current = Array.isArray(form?.values[arrayName]) ? [...form?.values[arrayName]] : [];
        current[index] = { ...current[index] ?? {}, [key]: value };
        form?.setValue(arrayName, current);
      }
    }),
    [row, errors, disabled, form, arrayName, index]
  );
  return /* @__PURE__ */ jsx52(FormContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs47("div", { className: cn("flex items-start gap-2 border p-3", tk.radiusMd, tk.border), children: [
    /* @__PURE__ */ jsx52("div", { className: "flex min-w-0 flex-1 flex-col gap-3", children }),
    /* @__PURE__ */ jsxs47("div", { className: "flex shrink-0 flex-col gap-1", children: [
      (canMoveUp || canMoveDown) && /* @__PURE__ */ jsxs47(Fragment16, { children: [
        /* @__PURE__ */ jsx52(RowButton2, { label: `Move row ${index + 1} up`, disabled: !canMoveUp, onClick: () => onMove(-1), children: /* @__PURE__ */ jsx52(Icon, { name: "chevron-up", size: 14, strokeWidth: 2.5 }) }),
        /* @__PURE__ */ jsx52(RowButton2, { label: `Move row ${index + 1} down`, disabled: !canMoveDown, onClick: () => onMove(1), children: /* @__PURE__ */ jsx52(Icon, { name: "chevron-down", size: 14, strokeWidth: 2.5 }) })
      ] }),
      /* @__PURE__ */ jsx52(RowButton2, { label: `Remove row ${index + 1}`, disabled: !canRemove, onClick: onRemove, danger: true, children: /* @__PURE__ */ jsx52(Icon, { name: "x", size: 14, strokeWidth: 2.5 }) })
    ] })
  ] }) });
}
function RowButton2({
  label,
  disabled,
  onClick,
  danger = false,
  children
}) {
  return /* @__PURE__ */ jsx52(
    "button",
    {
      type: "button",
      "aria-label": label,
      disabled,
      onClick,
      className: cn(
        "rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30",
        tk.fgMuted,
        danger ? cn(tk.hoverBgDestructiveSoft, "hover:text-[color:oklch(var(--rm-destructive))]") : cn(tk.hoverBgMuted, tk.hoverFg),
        focusRing
      ),
      children
    }
  );
}

// src/components/combobox.tsx
import {
  useCallback as useCallback11,
  useEffect as useEffect22,
  useId as useId13,
  useMemo as useMemo8,
  useRef as useRef21,
  useState as useState31
} from "react";
import { jsx as jsx53, jsxs as jsxs48 } from "react/jsx-runtime";
function Combobox({
  options,
  loadOptions,
  value,
  onChange,
  multiple = false,
  searchable = true,
  placeholder = "Search",
  emptyText = "Nothing matches that",
  disabled,
  id,
  className
}) {
  const c = useControl(id);
  const baseId = useId13();
  const bound = c.read();
  const raw = value ?? bound;
  const selected = useMemo8(
    () => multiple ? Array.isArray(raw) ? raw : raw ? [String(raw)] : [] : raw ? [String(raw)] : [],
    [multiple, raw]
  );
  const [open, setOpen] = useState31(false);
  const [query, setQuery] = useState31("");
  const [active, setActive] = useState31(0);
  const [loaded, setLoaded] = useState31([]);
  const [loading, setLoading] = useState31(false);
  const openPanel = () => {
    setOpen(true);
    setActive(0);
  };
  const rootRef = useRef21(null);
  const listRef = useRef21(null);
  const inputRef = useRef21(null);
  const off = disabled || c.disabled;
  const floating = useFloating({ open, side: "bottom", align: "start", gap: 4, matchWidth: true });
  const seq = useRef21(0);
  const loadRef = useRef21(loadOptions);
  loadRef.current = loadOptions;
  useEffect22(() => {
    if (!open || !loadRef.current) return;
    const mine = ++seq.current;
    setLoading(true);
    const t = setTimeout(() => {
      void Promise.resolve(loadRef.current?.(query)).then((list) => {
        if (mine !== seq.current) return;
        setLoaded(list ?? []);
      }).catch(() => {
        if (mine === seq.current) setLoaded([]);
      }).finally(() => {
        if (mine === seq.current) setLoading(false);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [open, query]);
  const all = loadOptions ? loaded : options ?? [];
  const shown = useMemo8(() => {
    if (loadOptions || !query.trim()) return all;
    const needle = query.trim().toLowerCase();
    return all.filter(
      (o) => o.value.toLowerCase().includes(needle) || labelText(o.label).toLowerCase().includes(needle)
    );
  }, [all, query, loadOptions]);
  const enabled = useMemo8(() => shown.filter((o) => !o.disabled), [shown]);
  useEffect22(() => {
    if (active > enabled.length - 1) setActive(Math.max(0, enabled.length - 1));
  }, [enabled.length, active]);
  const labelFor = useCallback11(
    (v) => all.find((o) => o.value === v)?.label ?? v,
    [all]
  );
  const commit = (next) => {
    const out = multiple ? next : next[0] ?? "";
    onChange?.(out);
    c.write(out);
  };
  const pick = (opt) => {
    if (opt.disabled) return;
    if (multiple) {
      commit(selected.includes(opt.value) ? selected.filter((v) => v !== opt.value) : [...selected, opt.value]);
      setQuery("");
      inputRef.current?.focus();
      return;
    }
    commit([opt.value]);
    setQuery("");
    setOpen(false);
  };
  useEffect22(() => {
    if (!open) return;
    const onDocClick = (e) => {
      const target = e.target;
      if (rootRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);
  const onKeyDown = (e) => {
    if (off) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openPanel();
        else setActive((i) => enabled.length ? (i + 1) % enabled.length : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) setActive((i) => enabled.length ? (i - 1 + enabled.length) % enabled.length : 0);
        break;
      case "Home":
        if (!open) return;
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        if (!open) return;
        e.preventDefault();
        setActive(Math.max(0, enabled.length - 1));
        break;
      case "Enter": {
        if (!open) return;
        e.preventDefault();
        const opt = enabled[active];
        if (opt) pick(opt);
        break;
      }
      case "Escape":
        if (!open) return;
        e.preventDefault();
        setOpen(false);
        break;
      case "Backspace":
        if (multiple && query === "" && selected.length > 0) {
          e.preventDefault();
          commit(selected.slice(0, -1));
        }
        break;
    }
  };
  const activeId = enabled[active] ? `${baseId}-o-${enabled[active].value}` : void 0;
  const singleLabel = !multiple && selected[0] ? labelText(labelFor(selected[0])) : "";
  return /* @__PURE__ */ jsxs48("div", { ref: rootRef, className: cn("relative text-left", className), children: [
    /* @__PURE__ */ jsxs48(
      "div",
      {
        ref: floating.refs.setReference,
        className: cn(
          inputBase,
          "flex min-h-[38px] flex-wrap items-center gap-1.5 py-1.5",
          off && cn("cursor-not-allowed", tk.bgMuted)
        ),
        onClick: () => {
          if (off) return;
          openPanel();
          inputRef.current?.focus();
        },
        children: [
          multiple && selected.map((v) => /* @__PURE__ */ jsx53(
            Badge,
            {
              variant: "neutral",
              size: "sm",
              onRemove: off ? void 0 : () => {
                commit(selected.filter((x) => x !== v));
              },
              removeLabel: `Remove ${labelText(labelFor(v))}`,
              onClick: (e) => e.stopPropagation(),
              children: labelFor(v)
            },
            v
          )),
          /* @__PURE__ */ jsx53(
            "input",
            {
              ref: inputRef,
              id: c.id,
              type: "text",
              role: "combobox",
              autoComplete: "off",
              "aria-expanded": open,
              "aria-controls": `${baseId}-list`,
              "aria-autocomplete": "list",
              "aria-activedescendant": open ? activeId : void 0,
              readOnly: !searchable,
              disabled: off,
              value: open || multiple ? query : singleLabel,
              placeholder: multiple && selected.length ? "" : !multiple && singleLabel ? singleLabel : placeholder,
              onChange: (e) => {
                setQuery(e.target.value);
                setActive(0);
                setOpen(true);
              },
              onFocus: () => {
                if (!off && !open) openPanel();
              },
              onKeyDown,
              ...c.ariaProps,
              className: cn(
                "min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm outline-none disabled:cursor-not-allowed",
                tk.fg,
                "placeholder:text-[color:oklch(var(--rm-muted-foreground))]"
              )
            }
          ),
          /* @__PURE__ */ jsx53(Icon, { name: "chevron-down", size: 16, className: cn("ml-auto", tk.fgMuted) })
        ]
      }
    ),
    open && /* @__PURE__ */ jsx53(OverlayPortal, { children: /* @__PURE__ */ jsxs48(
      "ul",
      {
        ref: (el) => {
          listRef.current = el;
          floating.refs.setFloating(el);
        },
        id: `${baseId}-list`,
        role: "listbox",
        "aria-multiselectable": multiple || void 0,
        style: floating.style,
        "data-rm-anim": "popover",
        "data-state": "open",
        className: cn("z-50 max-h-60 overflow-auto py-1", panelBase),
        children: [
          loading && shown.length === 0 && /* @__PURE__ */ jsx53("li", { className: cn("px-3 py-2 text-sm", tk.fgMuted), children: "Looking" }),
          !loading && shown.length === 0 && /* @__PURE__ */ jsx53("li", { className: cn("px-3 py-2 text-sm", tk.fgMuted), children: emptyText }),
          shown.map((opt) => {
            const on = selected.includes(opt.value);
            const highlighted = !opt.disabled && enabled[active]?.value === opt.value;
            return /* @__PURE__ */ jsxs48(
              "li",
              {
                id: `${baseId}-o-${opt.value}`,
                role: "option",
                "aria-selected": on,
                "aria-disabled": opt.disabled || void 0,
                onMouseDown: (e) => e.preventDefault(),
                onClick: () => pick(opt),
                className: cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                  tk.fgPopover,
                  on && tk.bgMuted,
                  highlighted && cn(tk.bgMuted, tk.fg),
                  opt.disabled && "cursor-not-allowed opacity-50"
                ),
                children: [
                  /* @__PURE__ */ jsx53("span", { className: "min-w-0 flex-1 truncate", children: opt.label }),
                  on && /* @__PURE__ */ jsx53(Icon, { name: "check", size: 16, strokeWidth: 2.5, className: tk.fgPrimary })
                ]
              },
              opt.value
            );
          })
        ]
      }
    ) })
  ] });
}
function labelText(label) {
  return typeof label === "string" || typeof label === "number" ? String(label) : "";
}

// src/components/date-range.tsx
import { useMemo as useMemo9 } from "react";
import { jsx as jsx54, jsxs as jsxs49 } from "react/jsx-runtime";
function isoDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function daysAgo(n) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function defaultPresets() {
  const today = () => isoDate(/* @__PURE__ */ new Date());
  return [
    { label: "Last 7 days", range: () => ({ from: isoDate(daysAgo(6)), to: today() }) },
    { label: "Last 30 days", range: () => ({ from: isoDate(daysAgo(29)), to: today() }) },
    { label: "Last 90 days", range: () => ({ from: isoDate(daysAgo(89)), to: today() }) },
    {
      label: "This month",
      range: () => {
        const now = /* @__PURE__ */ new Date();
        return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today() };
      }
    },
    {
      label: "This quarter",
      range: () => {
        const now = /* @__PURE__ */ new Date();
        const firstMonth = Math.floor(now.getMonth() / 3) * 3;
        return { from: isoDate(new Date(now.getFullYear(), firstMonth, 1)), to: today() };
      }
    }
  ];
}
function DateRangePicker({
  value,
  onChange,
  presets = true,
  min: min2,
  max: max2,
  fromLabel = "From",
  toLabel = "To",
  disabled,
  className
}) {
  const c = useControl();
  const bound = c.read();
  const current = value ?? bound ?? { from: "", to: "" };
  const off = disabled || c.disabled;
  const list = useMemo9(
    () => presets === true ? defaultPresets() : presets === false ? [] : presets,
    [presets]
  );
  const commit = (next) => {
    onChange?.(next);
    c.write(next);
  };
  const setFrom = (from) => commit({ from, to: current.to && from > current.to ? from : current.to });
  const setTo = (to) => commit({ from: current.from && to && to < current.from ? to : current.from, to });
  const active = list.find((p) => {
    const r = p.range();
    return r.from === current.from && r.to === current.to;
  });
  return /* @__PURE__ */ jsxs49("div", { className: cn("text-left", className), children: [
    list.length > 0 && // The presets read as one segmented row: the chosen period is the
    // raised segment, the others sit on the muted track.
    /* @__PURE__ */ jsx54("div", { className: cn("mb-2 inline-flex max-w-full flex-wrap items-center gap-0.5 p-0.5", tk.radiusMd, tk.bgMuted), children: list.map((p) => {
      const on = active?.label === p.label;
      return /* @__PURE__ */ jsx54(
        "button",
        {
          type: "button",
          disabled: off,
          "aria-pressed": on,
          onClick: () => commit(p.range()),
          className: cn(
            "h-7 whitespace-nowrap px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            tk.radiusSm,
            on ? cn(tk.bgCard, tk.fg, tk.shadowSm) : cn(tk.fgMuted, tk.hoverFg),
            focusRing
          ),
          children: p.label
        },
        p.label
      );
    }) }),
    /* @__PURE__ */ jsxs49("div", { className: "flex flex-wrap items-end gap-3", children: [
      /* @__PURE__ */ jsxs49("label", { className: "flex min-w-[9rem] flex-1 flex-col gap-1", children: [
        /* @__PURE__ */ jsx54("span", { className: cn("text-xs font-medium", tk.fgMuted), children: fromLabel }),
        /* @__PURE__ */ jsx54(
          "input",
          {
            type: "date",
            value: current.from,
            min: min2,
            max: current.to || max2,
            disabled: off,
            onChange: (e) => setFrom(e.target.value),
            ...c.ariaProps,
            className: cn(inputBase, "h-9")
          }
        )
      ] }),
      /* @__PURE__ */ jsxs49("label", { className: "flex min-w-[9rem] flex-1 flex-col gap-1", children: [
        /* @__PURE__ */ jsx54("span", { className: cn("text-xs font-medium", tk.fgMuted), children: toLabel }),
        /* @__PURE__ */ jsx54(
          "input",
          {
            type: "date",
            value: current.to,
            min: current.from || min2,
            max: max2,
            disabled: off,
            onChange: (e) => setTo(e.target.value),
            className: cn(inputBase, "h-9")
          }
        )
      ] })
    ] })
  ] });
}

// src/components/switch.tsx
import { jsx as jsx55, jsxs as jsxs50 } from "react/jsx-runtime";
function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
  id,
  ...props
}) {
  const c = useControl(id);
  const on = checked ?? Boolean(c.read());
  const off = disabled || c.disabled;
  const toggle = () => {
    if (off) return;
    onChange?.(!on);
    c.write(!on);
  };
  return /* @__PURE__ */ jsxs50("div", { className: cn("flex items-start gap-3 text-left", off && "opacity-60", className), children: [
    /* @__PURE__ */ jsx55(
      "button",
      {
        id: c.id,
        type: "button",
        role: "switch",
        "aria-checked": on,
        "aria-label": props["aria-label"],
        disabled: off,
        onClick: toggle,
        ...c.ariaProps,
        className: cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed",
          on ? tk.bgPrimary : tk.bgInput,
          focusRing
        ),
        children: /* @__PURE__ */ jsx55(
          "span",
          {
            "aria-hidden": "true",
            className: cn(
              "pointer-events-none inline-block h-4 w-4 transform rounded-full ring-0 transition-transform",
              tk.bgCard,
              tk.shadowSm,
              on ? "translate-x-4" : "translate-x-0"
            )
          }
        )
      }
    ),
    (label !== void 0 || description !== void 0) && /* @__PURE__ */ jsxs50("span", { className: "min-w-0", children: [
      label !== void 0 && /* @__PURE__ */ jsx55(
        "button",
        {
          type: "button",
          disabled: off,
          onClick: toggle,
          className: cn("block cursor-pointer text-left text-sm font-medium disabled:cursor-not-allowed", tk.fg),
          children: label
        }
      ),
      description !== void 0 && /* @__PURE__ */ jsx55("span", { className: cn("mt-0.5 block text-xs", tk.fgMuted), children: description })
    ] })
  ] });
}

// src/components/tag-input.tsx
import { useRef as useRef22, useState as useState32 } from "react";
import { jsx as jsx56, jsxs as jsxs51 } from "react/jsx-runtime";
function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  unique = true,
  max: max2,
  disabled,
  id,
  className
}) {
  const c = useControl(id);
  const bound = c.read();
  const tags = value ?? (Array.isArray(bound) ? bound : []);
  const [draft, setDraft] = useState32("");
  const inputRef = useRef22(null);
  const off = disabled || c.disabled;
  const commit = (next) => {
    onChange?.(next);
    c.write(next);
  };
  const add = (raw) => {
    const text = raw.trim();
    if (!text) return;
    if (unique && tags.includes(text)) {
      setDraft("");
      return;
    }
    if (max2 !== void 0 && tags.length >= max2) return;
    commit([...tags, text]);
    setDraft("");
  };
  const removeAt = (i) => commit(tags.filter((_, at) => at !== i));
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
      return;
    }
    if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      e.preventDefault();
      removeAt(tags.length - 1);
    }
  };
  return /* @__PURE__ */ jsxs51(
    "div",
    {
      onClick: () => inputRef.current?.focus(),
      className: cn(
        inputBase,
        "flex min-h-[38px] cursor-text flex-wrap items-center gap-1.5 py-1.5",
        off && cn("cursor-not-allowed", tk.bgMuted),
        className
      ),
      children: [
        tags.map((tag, i) => /* @__PURE__ */ jsx56(
          Badge,
          {
            variant: "neutral",
            size: "sm",
            onRemove: off ? void 0 : () => {
              removeAt(i);
            },
            removeLabel: `Remove ${tag}`,
            onClick: (e) => e.stopPropagation(),
            children: tag
          },
          `${tag}-${i}`
        )),
        /* @__PURE__ */ jsx56(
          "input",
          {
            ref: inputRef,
            id: c.id,
            type: "text",
            value: draft,
            disabled: off || max2 !== void 0 && tags.length >= max2,
            placeholder: tags.length === 0 ? placeholder : "",
            onChange: (e) => setDraft(e.target.value),
            onKeyDown,
            onBlur: () => add(draft),
            ...c.ariaProps,
            className: cn(
              "min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm outline-none disabled:cursor-not-allowed",
              tk.fg,
              "placeholder:text-[color:oklch(var(--rm-muted-foreground))]"
            )
          }
        )
      ]
    }
  );
}

// src/components/slider.tsx
import { jsx as jsx57, jsxs as jsxs52 } from "react/jsx-runtime";
function Slider({
  value,
  onChange,
  min: min2 = 0,
  max: max2 = 100,
  step = 1,
  showValue = true,
  formatValue,
  minLabel,
  maxLabel,
  className,
  id,
  disabled,
  style,
  ...props
}) {
  const c = useControl(id);
  const bound = c.read();
  const current = value ?? (typeof bound === "number" && Number.isFinite(bound) ? bound : Math.round((min2 + max2) / 2));
  const off = disabled || c.disabled;
  const span = max2 - min2 || 1;
  const percent = Math.min(100, Math.max(0, (current - min2) / span * 100));
  return /* @__PURE__ */ jsxs52("div", { className: cn("w-full text-left", className), children: [
    /* @__PURE__ */ jsxs52("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxs52("div", { className: "relative flex h-5 w-full items-center", children: [
        /* @__PURE__ */ jsx57("span", { "aria-hidden": "true", className: cn("absolute inset-x-0 h-1.5 rounded-full", tk.bgMuted) }),
        /* @__PURE__ */ jsx57(
          "span",
          {
            "aria-hidden": "true",
            className: cn("absolute left-0 h-1.5 rounded-full", tk.bgPrimary),
            style: { width: `${percent}%` }
          }
        ),
        /* @__PURE__ */ jsx57(
          "input",
          {
            id: c.id,
            type: "range",
            min: min2,
            max: max2,
            step,
            value: current,
            disabled: off,
            onChange: (e) => {
              const next = Number(e.target.value);
              onChange?.(next);
              c.write(next);
            },
            className: cn(
              "relative h-1.5 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-[color:oklch(var(--rm-primary))] disabled:cursor-not-allowed disabled:opacity-60",
              focusRing
            ),
            style,
            ...c.ariaProps,
            ...props
          }
        )
      ] }),
      showValue && /* @__PURE__ */ jsx57("output", { htmlFor: c.id, className: cn("w-12 shrink-0 text-right text-sm tabular-nums", tk.fg), children: formatValue ? formatValue(current) : current })
    ] }),
    (minLabel !== void 0 || maxLabel !== void 0) && /* @__PURE__ */ jsxs52("div", { className: cn("mt-1 flex justify-between text-xs", tk.fgMuted), children: [
      /* @__PURE__ */ jsx57("span", { children: minLabel }),
      /* @__PURE__ */ jsx57("span", { children: maxLabel })
    ] })
  ] });
}

// src/components/rating.tsx
import { useState as useState33 } from "react";
import { jsx as jsx58, jsxs as jsxs53 } from "react/jsx-runtime";
function Rating({
  value,
  onChange,
  max: max2 = 5,
  min: min2 = 1,
  variant = "star",
  readOnly = false,
  disabled,
  label = "Rating",
  describeValue,
  children,
  className
}) {
  const c = useControl();
  const bound = c.read();
  const current = value ?? (typeof bound === "number" && Number.isFinite(bound) ? bound : void 0);
  const off = disabled || c.disabled || readOnly;
  const [hover, setHover] = useState33(null);
  const values = [];
  for (let v = min2; v <= max2; v++) values.push(v);
  const pick = (v) => {
    if (off) return;
    onChange?.(v);
    c.write(v);
  };
  const onKeyDown = (e) => {
    if (off) return;
    const at = current ?? min2;
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(max2, at + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(min2, at - 1);
    else if (e.key === "Home") next = min2;
    else if (e.key === "End") next = max2;
    if (next === null) return;
    e.preventDefault();
    pick(next);
  };
  const shown = hover ?? current;
  return /* @__PURE__ */ jsxs53("div", { className: cn("flex items-center gap-2 text-left", className), children: [
    /* @__PURE__ */ jsx58(
      "div",
      {
        role: "radiogroup",
        "aria-label": label,
        "aria-describedby": c.ariaProps["aria-describedby"],
        "aria-invalid": c.ariaProps["aria-invalid"],
        tabIndex: off ? -1 : 0,
        onKeyDown,
        onMouseLeave: () => setHover(null),
        className: cn("inline-flex items-center gap-1 rounded", focusRing, off && "opacity-70"),
        children: values.map((v) => {
          const on = shown !== void 0 && v <= shown;
          const name = describeValue?.(v) ?? String(v);
          return /* @__PURE__ */ jsx58(
            "button",
            {
              type: "button",
              role: "radio",
              "aria-checked": current === v,
              "aria-label": name,
              tabIndex: -1,
              disabled: off,
              onClick: () => pick(v),
              onMouseEnter: () => !off && setHover(v),
              className: cn(
                "transition-colors disabled:cursor-not-allowed",
                tk.radiusSm,
                variant === "star" ? cn("p-0.5", on ? tk.fgWarning : tk.fgFaint) : cn("h-8 w-8 border text-sm font-medium", tk.borderInput, tk.fgMuted),
                variant === "scale" && current === v && cn(tk.borderPrimary, tk.bgPrimary, tk.fgOnPrimary)
              ),
              children: variant === "star" ? /* @__PURE__ */ jsx58(Icon, { name: "star", size: 20, strokeWidth: 1.5, className: cn(on && "fill-current") }) : v
            },
            v
          );
        })
      }
    ),
    children
  ] });
}

// src/components/json-input.tsx
import { useEffect as useEffect23, useRef as useRef23, useState as useState34 } from "react";
import { jsx as jsx59, jsxs as jsxs54 } from "react/jsx-runtime";
function print(value) {
  if (value === void 0 || value === null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}
function JsonInput({
  value,
  onChange,
  formatOnBlur = true,
  invalidMessage = "That is not valid JSON yet.",
  className,
  id,
  disabled,
  rows = 8,
  placeholder = '{\n  "example": "anything you like"\n}',
  ...props
}) {
  const c = useControl(id);
  const bound = value ?? c.read();
  const [text, setText] = useState34(() => print(bound));
  const [invalid, setInvalid] = useState34(false);
  const ownWrite = useRef23(print(bound));
  useEffect23(() => {
    const next = print(bound);
    if (next === ownWrite.current) return;
    ownWrite.current = next;
    setText(next);
    setInvalid(false);
  }, [bound]);
  const commit = (raw) => {
    if (raw.trim() === "") {
      ownWrite.current = "";
      onChange?.(void 0);
      c.write(void 0);
      return true;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return false;
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    const obj = parsed;
    ownWrite.current = print(obj);
    onChange?.(obj);
    c.write(obj);
    return true;
  };
  const errorId = `${c.id}-json-error`;
  const describedBy = [c.ariaProps["aria-describedby"], invalid ? errorId : null].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ jsxs54("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsx59(
      "textarea",
      {
        id: c.id,
        rows,
        spellCheck: false,
        placeholder,
        className: cn(inputBase, "min-h-[120px] resize-y font-mono text-xs leading-relaxed", className),
        value: text,
        disabled: disabled || c.disabled,
        onChange: (e) => {
          const raw = e.target.value;
          setText(raw);
          if (commit(raw)) setInvalid(false);
        },
        onBlur: (e) => {
          const raw = e.target.value;
          const ok = commit(raw);
          setInvalid(!ok);
          if (ok && formatOnBlur && raw.trim() !== "") {
            const pretty = print(JSON.parse(raw));
            ownWrite.current = pretty;
            setText(pretty);
          }
        },
        ...c.ariaProps,
        "aria-invalid": invalid || c.ariaProps["aria-invalid"] || void 0,
        "aria-describedby": describedBy,
        ...props
      }
    ),
    invalid && /* @__PURE__ */ jsx59("p", { id: errorId, role: "alert", className: cn("text-xs font-medium", tk.fgDestructive), children: invalidMessage })
  ] });
}

// src/components/file-upload.tsx
import { useEffect as useEffect24, useRef as useRef24, useState as useState35 } from "react";
import { markGesture } from "@robomotion/apps-runtime";
import { useFileUpload as useFileUpload2 } from "@robomotion/apps-runtime/react";

// src/components/progress.tsx
import { Fragment as Fragment17, jsx as jsx60, jsxs as jsxs55 } from "react/jsx-runtime";
function Progress({ value, label, showValue = false, className, ...props }) {
  const determinate = typeof value === "number" && Number.isFinite(value);
  const clamped = determinate ? Math.min(100, Math.max(0, value)) : 0;
  return /* @__PURE__ */ jsxs55("div", { className: cn("w-full", className), ...props, children: [
    (label || showValue && determinate) && /* @__PURE__ */ jsxs55("div", { className: cn("mb-1 flex items-center justify-between text-xs", tk.fgMuted), children: [
      /* @__PURE__ */ jsx60("span", { children: label }),
      showValue && determinate && /* @__PURE__ */ jsxs55("span", { className: "tabular-nums", children: [
        Math.round(clamped),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsx60(
      "div",
      {
        role: "progressbar",
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": determinate ? Math.round(clamped) : void 0,
        className: cn("h-2 w-full overflow-hidden rounded-full", tk.bgMuted),
        children: determinate ? /* @__PURE__ */ jsx60(
          "div",
          {
            className: cn("h-full rounded-full transition-[width] duration-300", tk.bgPrimary),
            style: { width: `${clamped}%` }
          }
        ) : /* @__PURE__ */ jsxs55(Fragment17, { children: [
          /* @__PURE__ */ jsx60("style", { children: `@keyframes rm-indeterminate{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}` }),
          /* @__PURE__ */ jsx60(
            "div",
            {
              className: cn("h-full w-1/3 rounded-full", tk.bgPrimary),
              style: { animation: "rm-indeterminate 1.2s ease-in-out infinite" }
            }
          )
        ] })
      }
    )
  ] });
}

// src/components/file-upload.tsx
import { jsx as jsx61, jsxs as jsxs56 } from "react/jsx-runtime";
function FileUpload({
  onUpload,
  onError,
  accept,
  label = "Drop a file here, or browse",
  hint,
  disabled = false,
  isPublic = false,
  action,
  params,
  className
}) {
  const { upload, uploading, progress, error } = useFileUpload2();
  const inputRef = useRef24(null);
  const zoneRef = useRef24(null);
  const [dragOver, setDragOver] = useState35(false);
  const [uploaded, setUploaded] = useState35(null);
  const onErrorRef = useRef24(onError);
  onErrorRef.current = onError;
  useEffect24(() => {
    if (error) onErrorRef.current?.(error);
  }, [error]);
  const start = async (file) => {
    if (!file || disabled || uploading) return;
    setUploaded(null);
    const ref = await upload(file, { isPublic });
    if (ref) {
      setUploaded(ref);
      markGesture(zoneRef.current);
      onUpload?.(ref);
      if (action) {
        const extra = typeof params === "function" ? params() : params;
        void runAction(action, { file: ref, ...extra ?? {} }).catch(() => void 0);
      }
    }
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    void start(e.dataTransfer.files?.[0]);
  };
  return /* @__PURE__ */ jsxs56("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx61(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept,
        className: "sr-only",
        tabIndex: -1,
        "aria-hidden": "true",
        onChange: (e) => {
          void start(e.target.files?.[0]);
          e.target.value = "";
        }
      }
    ),
    /* @__PURE__ */ jsxs56(
      "button",
      {
        ref: zoneRef,
        type: "button",
        "data-rm-dropzone": "",
        "data-rm-action": action?.name,
        "data-rm-dragover": dragOver || void 0,
        disabled: disabled || uploading,
        onClick: () => inputRef.current?.click(),
        onDragOver: (e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        },
        onDragLeave: () => setDragOver(false),
        onDrop,
        className: cn(
          "flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-8 text-center transition-colors",
          tk.radius,
          focusRing,
          dragOver ? cn(tk.borderPrimary, tk.bgMutedHalf) : cn(tk.borderInput, tk.bgCard, "hover:border-[color:oklch(var(--rm-muted-foreground))]"),
          (disabled || uploading) && "cursor-not-allowed opacity-60"
        ),
        children: [
          /* @__PURE__ */ jsx61(
            "span",
            {
              "aria-hidden": "true",
              className: cn("mb-1 flex h-12 w-12 items-center justify-center rounded-full", tk.bgMuted, dragOver ? tk.fgPrimary : tk.fgMuted),
              children: /* @__PURE__ */ jsx61(Icon, { name: "cloud-upload", size: 24, strokeWidth: 1.5 })
            }
          ),
          /* @__PURE__ */ jsx61("span", { className: cn("text-sm font-medium", tk.fg), children: label }),
          hint && /* @__PURE__ */ jsx61("span", { className: cn("text-xs", tk.fgMuted), children: hint })
        ]
      }
    ),
    uploading && /* @__PURE__ */ jsx61("div", { className: "mt-3", children: /* @__PURE__ */ jsx61(Progress, { value: progress, label: "Uploading", showValue: true }) }),
    !uploading && uploaded && /* @__PURE__ */ jsxs56("p", { className: cn("mt-2 flex items-center gap-1.5 text-sm", tk.fgSuccess), children: [
      /* @__PURE__ */ jsx61(Icon, { name: "circle-check", size: 16 }),
      uploaded.name,
      " uploaded"
    ] }),
    !uploading && error && /* @__PURE__ */ jsx61("p", { role: "alert", className: cn("mt-2 text-sm font-medium", tk.fgDestructive), children: error.message })
  ] });
}

// src/components/layout.tsx
import { useCallback as useCallback12, useEffect as useEffect25, useState as useState36 } from "react";
import { jsx as jsx62, jsxs as jsxs57 } from "react/jsx-runtime";
var GAP2 = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8"
};
var ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch"
};
var JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between"
};
function Stack({ className, gap = 4, align, ...props }) {
  return /* @__PURE__ */ jsx62(
    "div",
    {
      className: cn("flex flex-col", GAP2[gap], align && ALIGN[align], className),
      ...props
    }
  );
}
function Row({
  className,
  gap = 4,
  align = "center",
  justify,
  wrap = false,
  ...props
}) {
  return /* @__PURE__ */ jsx62(
    "div",
    {
      className: cn(
        "flex flex-row",
        GAP2[gap],
        ALIGN[align],
        justify && JUSTIFY[justify],
        wrap && "flex-wrap",
        className
      ),
      ...props
    }
  );
}
var COLS2 = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6"
};
var MD_COLS2 = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  6: "md:grid-cols-6"
};
var LG_COLS2 = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6"
};
function Grid({ className, gap = 4, cols = 1, mdCols, lgCols, ...props }) {
  return /* @__PURE__ */ jsx62(
    "div",
    {
      className: cn(
        "grid",
        GAP2[gap],
        COLS2[cols],
        mdCols && MD_COLS2[mdCols],
        lgCols && LG_COLS2[lgCols],
        className
      ),
      ...props
    }
  );
}
var FADE_PX = 32;
function ScrollRow({
  label,
  gap = 4,
  snap = false,
  arrows = true,
  fade = true,
  className,
  children,
  onKeyDown,
  ...props
}) {
  const { ref, width } = useMeasure();
  const [more, setMore] = useState36({ left: false, right: false });
  const read = useCallback12(() => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setMore((m) => m.left === left && m.right === right ? m : { left, right });
  }, [ref]);
  useEffect25(read);
  useEffect25(read, [read, width]);
  const scrollTo = (left) => {
    const el = ref.current;
    if (!el) return;
    const to = Math.max(0, left);
    if (typeof el.scrollTo === "function") el.scrollTo({ left: to, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    else el.scrollLeft = to;
    read();
  };
  const page = (dir) => {
    const el = ref.current;
    if (el) scrollTo(el.scrollLeft + dir * Math.max(120, el.clientWidth * 0.8));
  };
  const handleKeyDown = (e) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.target !== e.currentTarget) return;
    const el = e.currentTarget;
    if (e.key === "ArrowRight") scrollTo(el.scrollLeft + 120);
    else if (e.key === "ArrowLeft") scrollTo(el.scrollLeft - 120);
    else if (e.key === "Home") scrollTo(0);
    else if (e.key === "End") scrollTo(el.scrollWidth);
    else return;
    e.preventDefault();
  };
  const mask = fade && (more.left || more.right) ? `linear-gradient(to right, ${more.left ? "transparent" : "black"}, black ${FADE_PX}px, black calc(100% - ${FADE_PX}px), ${more.right ? "transparent" : "black"})` : void 0;
  const arrow2 = cn(
    "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border transition-colors",
    tk.border,
    tk.bgCard,
    tk.fgMuted,
    tk.hoverFg,
    tk.shadowMd,
    focusRing
  );
  return /* @__PURE__ */ jsxs57("div", { "data-rm-scroll-row": "", className: cn("relative", className), children: [
    /* @__PURE__ */ jsx62(
      "div",
      {
        ref,
        role: "group",
        "aria-label": label,
        tabIndex: 0,
        onScroll: read,
        onKeyDown: handleKeyDown,
        style: mask ? { maskImage: mask, WebkitMaskImage: mask } : void 0,
        className: cn(
          "flex overflow-x-auto pb-1 [scrollbar-width:thin]",
          GAP2[gap],
          snap && "snap-x snap-mandatory [&>*]:snap-start",
          "[&>*]:shrink-0",
          tk.radiusSm,
          focusRing
        ),
        ...props,
        children
      }
    ),
    arrows && more.left && // Out of the tab order: the row itself takes the arrow keys, and a
    // button that vanishes at the end of the row would take focus with it.
    /* @__PURE__ */ jsx62("button", { type: "button", tabIndex: -1, "aria-label": "Scroll back", onClick: () => page(-1), className: cn(arrow2, "left-1"), children: /* @__PURE__ */ jsx62(Icon, { name: "chevron-left", size: 16 }) }),
    arrows && more.right && /* @__PURE__ */ jsx62("button", { type: "button", tabIndex: -1, "aria-label": "Scroll forward", onClick: () => page(1), className: cn(arrow2, "right-1"), children: /* @__PURE__ */ jsx62(Icon, { name: "chevron-right", size: 16 }) })
  ] });
}

// src/components/assistant-widget.tsx
import { useEffect as useEffect26, useRef as useRef25, useState as useState37 } from "react";
import { useAssistant, useMaybeAppClient as useMaybeAppClient3 } from "@robomotion/apps-runtime/react";
import { jsx as jsx63, jsxs as jsxs58 } from "react/jsx-runtime";
function didLine(tools) {
  const words = tools.map(
    (t) => t.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim().toLowerCase().replace(/^./, (c) => c.toUpperCase())
  );
  if (words.length === 1) return `Ran ${words[0]}`;
  return `Ran ${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
var STORAGE_OPEN = "rm.app.assistant.open";
var assistantProse = cn(
  "[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
  "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
  "[&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:my-1 [&_h2]:my-1 [&_h3]:my-1",
  "[&_strong]:font-semibold [&_a]:underline [&_hr]:my-2",
  "[&_code]:rounded [&_code]:bg-[color:oklch(var(--rm-muted-foreground)/0.12)] [&_code]:px-1 [&_code]:text-[0.9em]",
  "[&_pre]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[color:oklch(var(--rm-muted-foreground)/0.12)] [&_pre]:p-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-1 [&_table]:text-xs [&_th]:px-1 [&_th]:py-0.5 [&_th]:text-left [&_td]:px-1 [&_td]:py-0.5 [&_th]:border-b [&_th]:border-[color:oklch(var(--rm-border))]",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-[color:oklch(var(--rm-border))] [&_blockquote]:pl-2 [&_blockquote]:opacity-80"
);
function AssistantWidget({ title = "Assistant", placeholder = "Ask the app to do something\u2026", className }) {
  const app = useMaybeAppClient3();
  if (!app) return null;
  return /* @__PURE__ */ jsx63(AssistantWidgetInner, { title, placeholder, className });
}
function AssistantWidgetInner({ title, placeholder, className }) {
  const { available, greeting, messages, busy, send } = useAssistant();
  const [open, setOpen] = useState37(() => {
    try {
      return sessionStorage.getItem(STORAGE_OPEN) === "1";
    } catch {
      return false;
    }
  });
  const [draft, setDraft] = useState37("");
  const listRef = useRef25(null);
  const inputRef = useRef25(null);
  useEffect26(() => {
    try {
      sessionStorage.setItem(STORAGE_OPEN, open ? "1" : "0");
    } catch {
    }
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect26(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);
  if (!available) return null;
  const submit = (e) => {
    e?.preventDefault();
    if (!draft.trim() || busy) return;
    send(draft);
    setDraft("");
  };
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };
  return /* @__PURE__ */ jsxs58("div", { className: cn("fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3", className), "data-rm-assistant": "", children: [
    open && /* @__PURE__ */ jsxs58(
      "div",
      {
        role: "dialog",
        "aria-label": title,
        "data-rm-anim": "dialog",
        "data-state": "open",
        className: cn(
          "flex h-[min(32rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden text-left",
          panelBase,
          tk.radiusLg
        ),
        children: [
          /* @__PURE__ */ jsxs58("header", { className: cn("flex items-center justify-between border-b px-4 py-3", mutedBar), children: [
            /* @__PURE__ */ jsxs58("div", { className: cn("flex items-center gap-2", tk.fg), children: [
              /* @__PURE__ */ jsx63(Icon, { name: "sparkles", size: 16, className: tk.fgPrimary }),
              /* @__PURE__ */ jsx63("span", { className: "text-sm font-semibold", children: title })
            ] }),
            /* @__PURE__ */ jsx63(
              "button",
              {
                type: "button",
                onClick: () => setOpen(false),
                className: cn("px-2 py-1 text-xs", ghostControl, focusRing),
                "aria-label": "Close assistant",
                children: "Close"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs58("div", { ref: listRef, className: "flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm", children: [
            messages.length === 0 && /* @__PURE__ */ jsx63("p", { className: tk.fgMuted, children: greeting || "Tell me what you want done in this app and I will do it." }),
            messages.map((m) => /* @__PURE__ */ jsx63("div", { className: cn("flex", m.role === "user" ? "justify-end" : "justify-start"), children: /* @__PURE__ */ jsxs58(
              "div",
              {
                className: cn(
                  "max-w-[85%] px-3 py-2",
                  tk.radiusLg,
                  m.role === "user" ? cn("whitespace-pre-wrap rounded-br-[calc(var(--rm-radius)_-_0.125rem)]", tk.bgPrimary, tk.fgOnPrimary) : cn("rounded-bl-[calc(var(--rm-radius)_-_0.125rem)]", tk.bgMuted, tk.fg, assistantProse)
                ),
                children: [
                  m.tools && m.tools.length > 0 && /* @__PURE__ */ jsx63("div", { className: "mb-1 text-[11px] opacity-70", children: didLine(m.tools) }),
                  m.role === "user" ? m.text : m.text ? /* @__PURE__ */ jsx63(Xa, { mode: "streaming", isAnimating: !!m.streaming, children: m.text }) : m.streaming ? /* @__PURE__ */ jsx63("span", { className: "animate-pulse", children: "\u2026" }) : null,
                  m.error && /* @__PURE__ */ jsx63("div", { className: cn("mt-1 text-[12px]", tk.fgDestructive), children: m.error })
                ]
              }
            ) }, m.id))
          ] }),
          /* @__PURE__ */ jsx63("form", { onSubmit: submit, className: cn("border-t p-3", tk.border), children: /* @__PURE__ */ jsxs58("div", { className: "flex items-end gap-2", children: [
            /* @__PURE__ */ jsx63(
              "textarea",
              {
                ref: inputRef,
                value: draft,
                onChange: (e) => setDraft(e.target.value),
                onKeyDown: onKey,
                rows: 1,
                placeholder,
                className: cn(inputBase, "max-h-32 min-h-[2.5rem] flex-1 resize-none", focusRing),
                "aria-label": "Message the assistant"
              }
            ),
            /* @__PURE__ */ jsx63(
              "button",
              {
                type: "submit",
                disabled: busy || !draft.trim(),
                "aria-label": "Send",
                className: cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center hover:brightness-95 disabled:opacity-50",
                  tk.radiusMd,
                  tk.bgPrimary,
                  tk.fgOnPrimary,
                  focusRing
                ),
                children: busy ? /* @__PURE__ */ jsx63("span", { className: "animate-pulse", children: "\u2026" }) : /* @__PURE__ */ jsx63(Icon, { name: "send", size: 16 })
              }
            )
          ] }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs58(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        "aria-label": open ? `Hide ${title}` : `Open ${title}`,
        className: cn(
          "flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold hover:brightness-95",
          tk.bgPrimary,
          tk.fgOnPrimary,
          tk.shadowLg,
          focusRing
        ),
        children: [
          /* @__PURE__ */ jsx63(Icon, { name: "sparkles", size: 18 }),
          title
        ]
      }
    )
  ] });
}
export {
  Accordion,
  AccordionItem,
  Alert,
  AnimatedNumber,
  AppShell,
  AssistantWidget,
  Avatar,
  AvatarGroup,
  Badge,
  BarList,
  Breadcrumbs,
  Button,
  Calendar,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chart,
  Checkbox,
  Combobox,
  Composer,
  ConfirmDialog,
  ConnectionBanner,
  CopyButton,
  DEFAULT_ACCENT,
  DataTable,
  DatePicker,
  DateRangePicker,
  DescriptionList,
  Dialog,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FieldArray,
  FileUpload,
  Form,
  Grid,
  ICON_NAMES,
  Icon,
  Image,
  ImageCompare,
  ImageGrid,
  ImageMarkup,
  JsonInput,
  JsonView,
  Kanban,
  KanbanCard,
  KanbanColumn,
  Kbd,
  Lightbox,
  MarkList,
  Markdown,
  Menu,
  MenuItem,
  Message,
  Meter,
  NumberInput,
  PageHeader,
  Pagination,
  Popover,
  Progress,
  ProgressSteps,
  RadioGroup,
  Rating,
  Row,
  Screen,
  ScrollRow,
  SearchInput,
  SegmentedControl,
  Select,
  Separator,
  Skeleton,
  Slider,
  Sparkline,
  Spinner,
  Stack,
  Stat,
  StatusBadge,
  Step,
  Stepper,
  Switch,
  Tab,
  TabPanel,
  Tabs,
  TagInput,
  TextArea,
  TextInput,
  ThemeToggle,
  Thread,
  TimePicker,
  Timeline,
  TimelineItem,
  Toast,
  Toolbar,
  Tooltip2 as Tooltip,
  accentStyle,
  applyAccent,
  applyTheme,
  cn,
  dismissToast,
  ensureTokens,
  focusRing,
  inputBase,
  renderIcon,
  resolveIconName,
  setTheme,
  textStyles,
  tk,
  toast,
  useFormValues,
  useMarkHistory,
  useTheme,
  useThemeBridge,
  useToast
};
//# sourceMappingURL=index.js.map