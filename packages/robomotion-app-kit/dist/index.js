import {
  Xa,
  clsx
} from "./chunk-MAGV6XDF.js";

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
  const scale2 = fromTheme("scale");
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
        scale: [scale2]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [scale2]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [scale2]
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

// src/theme.ts
var DEFAULT_ACCENT = "#FF4F00";
function accentStyle(accent) {
  return { "--rm-accent": accent || DEFAULT_ACCENT };
}
var focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--rm-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950";
var inputBase = "block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:border-[color:var(--rm-accent)] focus:outline-none focus:ring-1 focus:ring-[color:var(--rm-accent)] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500";

// src/theme-sync.ts
import { useEffect } from "react";
var STORAGE_KEY = "rm-theme";
function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.toggle("dark", theme === "dark");
  el.style.colorScheme = theme;
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

// src/components/connection-banner.tsx
import { useEffect as useEffect2, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { useMaybeAppClient } from "@robomotion/apps-runtime/react";

// src/components/button.tsx
import { forwardRef } from "react";

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

// src/components/button.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    focusRing
  ),
  {
    variants: {
      variant: {
        primary: "bg-[color:var(--rm-accent)] text-white shadow-sm hover:brightness-95 active:brightness-90",
        secondary: "border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
        ghost: "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-sm"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);
var Button = forwardRef(function Button2({ className, variant, size, loading, disabled, children, type, action, params, onClick, ...props }, ref) {
  const busy = loading ?? action?.loading ?? false;
  const handleClick = action ? (e) => {
    onClick?.(e);
    void Promise.resolve(action.run(resolveParams(params, e))).catch(() => void 0);
  } : onClick;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ref,
      type: type ?? "button",
      className: cn(buttonVariants({ variant, size }), className),
      disabled: disabled || busy,
      "aria-busy": busy || void 0,
      "data-rm-action": action?.name,
      onClick: handleClick,
      ...props,
      children: [
        busy && /* @__PURE__ */ jsx(Spinner, {}),
        children
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
        /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsx(
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
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
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
  return useSyncExternalStore(
    subscribe,
    () => order.length === 0 || order[0] === id,
    () => true
  );
}
function ConnectionBanner({ state, className }) {
  const owns = useOwnsBannerSlot();
  if (!owns) return null;
  if (state !== void 0) return /* @__PURE__ */ jsx2(BannerView, { state, className });
  return /* @__PURE__ */ jsx2(AutoBanner, { className });
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
  return /* @__PURE__ */ jsx2(
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
function BannerView({
  state,
  className,
  onStart,
  starting,
  startError,
  mismatch
}) {
  if (state === "ready" || state === "connecting") return null;
  if (state === "app_not_running") {
    return /* @__PURE__ */ jsxs2(
      "div",
      {
        role: "status",
        className: cn(
          "flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-left dark:border-amber-500/30 dark:bg-amber-950",
          className
        ),
        children: [
          /* @__PURE__ */ jsx2("p", { className: "text-sm font-medium text-amber-800 dark:text-amber-300", children: startError ?? "This app isn't running, so nothing on this page will respond yet." }),
          onStart ? /* @__PURE__ */ jsx2(Button, { variant: "secondary", size: "sm", disabled: starting, onClick: onStart, children: starting ? "Starting\u2026" : "Start it" }) : null
        ]
      }
    );
  }
  if (state === "contract_mismatch") {
    const otherApp = mismatch?.reason === "other_app";
    return /* @__PURE__ */ jsxs2(
      "div",
      {
        role: "alert",
        className: cn(
          "flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-left",
          otherApp ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950" : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-950",
          className
        ),
        children: [
          /* @__PURE__ */ jsx2(
            "p",
            {
              className: cn(
                "text-sm font-medium",
                otherApp ? "text-amber-800 dark:text-amber-300" : "text-red-800 dark:text-red-300"
              ),
              children: mismatch?.message ?? "This app was updated. Reload the page to continue."
            }
          ),
          otherApp ? (
            // Starting this app IS the fix, and it is one press when the page
            // can do it. Reload is not offered at all: it is the loop.
            onStart ? /* @__PURE__ */ jsx2(Button, { variant: "secondary", size: "sm", disabled: starting, onClick: onStart, children: starting ? "Starting\u2026" : "Start this app" }) : null
          ) : /* @__PURE__ */ jsx2(
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
  const message = state === "robot_offline" ? "The robot for this app is offline. Waiting for it to come back." : state === "unconfigured" ? (
    // Nothing was lost: this app has never had a backend to talk to.
    // Saying "reconnecting" here sends people hunting for a network
    // problem that does not exist.
    "Not connected to your robot yet. The screens below show sample data."
  ) : "Connection lost. Reconnecting.";
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      role: "status",
      className: cn(
        "flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-left dark:border-amber-500/30 dark:bg-amber-950",
        className
      ),
      children: [
        /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", className: "h-2 w-2 animate-pulse rounded-full bg-amber-500" }),
        /* @__PURE__ */ jsx2("p", { className: "text-sm font-medium text-amber-800 dark:text-amber-300", children: message })
      ]
    }
  );
}

// src/components/toast.tsx
import { useEffect as useEffect3, useState as useState2 } from "react";
import { currentCause, splitLinkKey } from "@robomotion/apps-runtime";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
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
var VARIANT_STYLES = {
  default: "border-neutral-200 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
  success: "border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-950 dark:text-green-300",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-950 dark:text-red-300"
};
function Toast({ className }) {
  const [list, setList] = useState2(items);
  useEffect3(() => {
    const listener = (l) => setList(l);
    listeners2.add(listener);
    setList(items);
    return () => {
      listeners2.delete(listener);
    };
  }, []);
  if (list.length === 0) return null;
  return /* @__PURE__ */ jsx3(
    "div",
    {
      "aria-live": "polite",
      "aria-label": "Notifications",
      className: cn(
        "pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2",
        className
      ),
      children: list.map((item) => /* @__PURE__ */ jsxs3(
        "div",
        {
          role: "status",
          className: cn(
            "pointer-events-auto flex items-start gap-3 rounded-lg border p-3 text-left shadow-lg",
            VARIANT_STYLES[item.variant]
          ),
          ...causeAttrs(item.cause),
          children: [
            /* @__PURE__ */ jsxs3("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx3("div", { className: "text-sm font-medium", children: item.title }),
              item.description !== void 0 && /* @__PURE__ */ jsx3("div", { className: "mt-0.5 text-sm opacity-80", children: item.description })
            ] }),
            /* @__PURE__ */ jsx3(
              "button",
              {
                type: "button",
                "aria-label": "Dismiss notification",
                onClick: () => dismissToast(item.id),
                className: "shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--rm-accent)]",
                children: /* @__PURE__ */ jsx3("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx3("path", { strokeLinecap: "round", d: "M6 6l12 12M18 6L6 18" }) })
              }
            )
          ]
        },
        item.id
      ))
    }
  );
}

// src/components/app-shell.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function AppShell({
  title,
  accent,
  logo,
  nav,
  activePath,
  onNavigate,
  connectionState,
  headerRight,
  children,
  className,
  style,
  ...props
}) {
  useThemeBridge();
  return /* @__PURE__ */ jsxs4(
    "div",
    {
      className: cn(
        "flex min-h-screen flex-col bg-neutral-50 text-left text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100",
        className
      ),
      style: { ...accentStyle(accent), ...style },
      ...props,
      children: [
        /* @__PURE__ */ jsx4("header", { className: "border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900", children: /* @__PURE__ */ jsxs4("div", { className: "mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4", children: [
          /* @__PURE__ */ jsxs4("div", { className: "flex min-w-0 items-center gap-2.5", children: [
            logo ?? /* @__PURE__ */ jsx4(
              "span",
              {
                "aria-hidden": "true",
                className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color:var(--rm-accent)] text-sm font-bold text-white",
                children: firstGlyph(title)
              }
            ),
            /* @__PURE__ */ jsx4("span", { className: "truncate text-sm font-semibold", children: title })
          ] }),
          nav && nav.length > 0 && /* @__PURE__ */ jsx4("nav", { "aria-label": "Main", className: "flex items-center gap-1 overflow-x-auto", children: nav.map((item) => {
            const active = item.path === activePath;
            const classes = cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              focusRing,
              active ? "bg-neutral-100 text-[color:var(--rm-accent)] dark:bg-neutral-800" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            );
            return onNavigate ? /* @__PURE__ */ jsx4(
              "button",
              {
                type: "button",
                onClick: () => onNavigate(item.path),
                "aria-current": active ? "page" : void 0,
                className: classes,
                children: item.label
              },
              item.path
            ) : /* @__PURE__ */ jsx4(
              "a",
              {
                href: item.path,
                "aria-current": active ? "page" : void 0,
                className: classes,
                children: item.label
              },
              item.path
            );
          }) }),
          /* @__PURE__ */ jsx4("div", { className: "ml-auto flex items-center gap-2", children: headerRight })
        ] }) }),
        /* @__PURE__ */ jsx4(ConnectionBanner, { state: connectionState }),
        /* @__PURE__ */ jsx4("main", { className: "mx-auto w-full max-w-5xl flex-1 px-4 py-6", children }),
        /* @__PURE__ */ jsx4(Toast, {})
      ]
    }
  );
}
function firstGlyph(title) {
  if (typeof title === "string" && title.length > 0) return title[0].toUpperCase();
  return "R";
}

// src/components/screen.tsx
import { useId } from "react";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function Screen({ title, description, actions, children, className, ...props }) {
  const headingId = useId();
  return /* @__PURE__ */ jsxs5("section", { "aria-labelledby": headingId, className: cn("text-left", className), ...props, children: [
    /* @__PURE__ */ jsxs5("header", { className: "mb-6 flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs5("div", { children: [
        /* @__PURE__ */ jsx5(
          "h1",
          {
            id: headingId,
            className: "text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100",
            children: title
          }
        ),
        description !== void 0 && /* @__PURE__ */ jsx5("p", { className: "mt-1 text-sm text-neutral-500 dark:text-neutral-400", children: description })
      ] }),
      actions !== void 0 && /* @__PURE__ */ jsx5("div", { className: "flex items-center gap-2", children: actions })
    ] }),
    children
  ] });
}

// src/components/menu.tsx
import {
  Children,
  createContext,
  forwardRef as forwardRef2,
  useContext,
  useEffect as useEffect4,
  useRef,
  useState as useState3
} from "react";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var MenuContext = createContext(null);
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
  const [open, setOpen] = useState3(false);
  const buttonRef = useRef(null);
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  useEffect4(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
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
  return /* @__PURE__ */ jsxs6("div", { ref: rootRef, className: cn("relative inline-block", className), children: [
    /* @__PURE__ */ jsx6(
      "button",
      {
        ref: buttonRef,
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
        className: cn(
          "rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
          focusRing
        ),
        children: trigger ?? /* @__PURE__ */ jsx6(MoreIcon, {})
      }
    ),
    open && /* @__PURE__ */ jsx6(MenuContext.Provider, { value: { close }, children: /* @__PURE__ */ jsx6(
      "div",
      {
        ref: panelRef,
        role: "menu",
        "aria-label": menuLabel,
        onKeyDown: onMenuKeyDown,
        className: cn(
          "absolute z-20 mt-1 w-44 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 text-left shadow-lg dark:border-neutral-700 dark:bg-neutral-900",
          align === "end" ? "right-0" : "left-0"
        ),
        children: items2 ? items2.map((item, i) => /* @__PURE__ */ jsx6(
          MenuItem,
          {
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
    ) })
  ] });
}
var MenuItem = forwardRef2(function MenuItem2({ danger, action, params, onSelect, children, className, disabled, onClick, ...props }, ref) {
  const menu = useContext(MenuContext);
  return /* @__PURE__ */ jsx6(
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
          void Promise.resolve(action.run(resolveParams(params, e))).catch(() => void 0);
        }
      },
      className: cn(
        "block w-full px-3 py-1.5 text-left text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        danger ? "text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10" : "text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800",
        className
      ),
      ...props,
      children
    }
  );
});
function enabledItems(panel) {
  if (!panel) return [];
  return Array.from(panel.querySelectorAll('[role="menuitem"]')).filter(
    (el) => !el.disabled
  );
}
function MoreIcon() {
  return /* @__PURE__ */ jsxs6("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "currentColor", children: [
    /* @__PURE__ */ jsx6("circle", { cx: "12", cy: "5", r: "1.75" }),
    /* @__PURE__ */ jsx6("circle", { cx: "12", cy: "12", r: "1.75" }),
    /* @__PURE__ */ jsx6("circle", { cx: "12", cy: "19", r: "1.75" })
  ] });
}

// src/components/card.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx7(
    "div",
    {
      className: cn(
        "rounded-lg border border-neutral-200 bg-white text-left shadow-sm dark:border-neutral-800 dark:bg-neutral-900",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, title, description, children, ...props }) {
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      className: cn(
        "border-b border-neutral-200 px-4 py-3 dark:border-neutral-800",
        className
      ),
      ...props,
      children: [
        title !== void 0 && /* @__PURE__ */ jsx7("h3", { className: "text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: title }),
        description !== void 0 && /* @__PURE__ */ jsx7("p", { className: "mt-0.5 text-sm text-neutral-500 dark:text-neutral-400", children: description }),
        children
      ]
    }
  );
}
function CardBody({ className, ...props }) {
  return /* @__PURE__ */ jsx7("div", { className: cn("px-4 py-4", className), ...props });
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx7(
    "div",
    {
      className: cn(
        "flex items-center justify-end gap-2 rounded-b-lg border-t border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60",
        className
      ),
      ...props
    }
  );
}

// src/components/dialog.tsx
import {
  useCallback,
  useEffect as useEffect5,
  useId as useId2,
  useRef as useRef2,
  useState as useState4
} from "react";
import { createPortal } from "react-dom";
import { Fragment, jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
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
  useEffect5(() => {
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
var overlayBackdrop = "fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-[1px] dark:bg-black/60";
var SIZES = {
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
  size = "md",
  hideClose = false,
  static: isStatic = false,
  className,
  children
}) {
  const { panelRef, onKeyDown } = useOverlay(open, onClose);
  const id = useId2();
  if (!open) return null;
  return /* @__PURE__ */ jsxs8(OverlayPortal, { children: [
    /* @__PURE__ */ jsx8("div", { className: overlayBackdrop, onClick: isStatic ? void 0 : onClose }),
    /* @__PURE__ */ jsx8("div", { className: "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4", children: /* @__PURE__ */ jsxs8(
      "div",
      {
        ref: panelRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": title !== void 0 ? `${id}-title` : void 0,
        "aria-describedby": description !== void 0 ? `${id}-desc` : void 0,
        tabIndex: -1,
        onKeyDown,
        className: cn(
          "w-full rounded-lg border border-neutral-200 bg-white text-left shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-900",
          SIZES[size],
          className
        ),
        children: [
          (title !== void 0 || !hideClose) && /* @__PURE__ */ jsxs8("div", { className: "flex items-start gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800", children: [
            /* @__PURE__ */ jsxs8("div", { className: "min-w-0 flex-1", children: [
              title !== void 0 && /* @__PURE__ */ jsx8(
                "h2",
                {
                  id: `${id}-title`,
                  className: "text-base font-semibold text-neutral-900 dark:text-neutral-100",
                  children: title
                }
              ),
              description !== void 0 && /* @__PURE__ */ jsx8("p", { id: `${id}-desc`, className: "mt-1 text-sm text-neutral-500 dark:text-neutral-400", children: description })
            ] }),
            !hideClose && /* @__PURE__ */ jsx8(CloseButton, { onClick: onClose })
          ] }),
          children !== void 0 && /* @__PURE__ */ jsx8("div", { className: "px-5 py-4 text-sm text-neutral-800 dark:text-neutral-200", children }),
          footer !== void 0 && /* @__PURE__ */ jsx8("div", { className: "flex items-center justify-end gap-2 rounded-b-lg border-t border-neutral-200 bg-neutral-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900/60", children: footer })
        ]
      }
    ) })
  ] });
}
function CloseButton({ onClick, label = "Close" }) {
  return /* @__PURE__ */ jsx8(
    "button",
    {
      type: "button",
      "aria-label": label,
      onClick,
      className: cn(
        "-mr-1 shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        focusRing
      ),
      children: /* @__PURE__ */ jsx8("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx8("path", { strokeLinecap: "round", d: "M6 6l12 12M18 6L6 18" }) })
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
  const [busy, setBusy] = useState4(false);
  useEffect5(() => {
    if (!open) setBusy(false);
  }, [open]);
  const confirm = () => {
    onConfirm?.();
    if (!action) {
      onClose();
      return;
    }
    setBusy(true);
    void Promise.resolve(action.run(resolveParams(params, void 0))).catch(() => void 0).finally(() => {
      setBusy(false);
      onClose();
    });
  };
  return /* @__PURE__ */ jsx8(
    Dialog,
    {
      open,
      onClose: busy ? () => void 0 : onClose,
      static: busy,
      hideClose: busy,
      size: "sm",
      title,
      description,
      footer: /* @__PURE__ */ jsxs8(Fragment, { children: [
        /* @__PURE__ */ jsx8(Button, { variant: "secondary", onClick: onClose, disabled: busy, children: cancelLabel }),
        /* @__PURE__ */ jsx8(
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
import { useId as useId3 } from "react";
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
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
  size = "md",
  footer,
  hideClose = false,
  className,
  children
}) {
  const { panelRef, onKeyDown } = useOverlay(open, onClose);
  const id = useId3();
  if (!open) return null;
  return /* @__PURE__ */ jsxs9(OverlayPortal, { children: [
    /* @__PURE__ */ jsx9("div", { className: overlayBackdrop, onClick: onClose }),
    /* @__PURE__ */ jsx9(
      "div",
      {
        className: cn(
          "fixed inset-y-0 z-50 flex w-full p-0",
          side === "right" ? "right-0 justify-end" : "left-0 justify-start",
          WIDTHS[size]
        ),
        children: /* @__PURE__ */ jsxs9(
          "div",
          {
            ref: panelRef,
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": title !== void 0 ? `${id}-title` : void 0,
            "aria-describedby": description !== void 0 ? `${id}-desc` : void 0,
            tabIndex: -1,
            onKeyDown,
            className: cn(
              "flex h-full w-full flex-col border-neutral-200 bg-white text-left shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-900",
              side === "right" ? "border-l" : "border-r",
              className
            ),
            children: [
              (title !== void 0 || !hideClose) && /* @__PURE__ */ jsxs9("div", { className: "flex items-start gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800", children: [
                /* @__PURE__ */ jsxs9("div", { className: "min-w-0 flex-1", children: [
                  title !== void 0 && /* @__PURE__ */ jsx9(
                    "h2",
                    {
                      id: `${id}-title`,
                      className: "text-base font-semibold text-neutral-900 dark:text-neutral-100",
                      children: title
                    }
                  ),
                  description !== void 0 && /* @__PURE__ */ jsx9("p", { id: `${id}-desc`, className: "mt-1 text-sm text-neutral-500 dark:text-neutral-400", children: description })
                ] }),
                !hideClose && /* @__PURE__ */ jsx9(CloseButton, { onClick: onClose })
              ] }),
              /* @__PURE__ */ jsx9("div", { className: "flex-1 overflow-y-auto px-5 py-4 text-sm text-neutral-800 dark:text-neutral-200", children }),
              footer !== void 0 && /* @__PURE__ */ jsx9("div", { className: "flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900/60", children: footer })
            ]
          }
        )
      }
    )
  ] });
}

// src/components/tabs.tsx
import {
  Children as Children2,
  createContext as createContext2,
  isValidElement,
  useContext as useContext2,
  useId as useId4,
  useRef as useRef3,
  useState as useState5
} from "react";
import { jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
var TabsContext = createContext2(null);
function Tabs({ value, defaultValue: defaultValue2, onChange, label = "Sections", className, children }) {
  const baseId = useId4();
  const listRef = useRef3(null);
  const items2 = Children2.toArray(children);
  const tabs = items2.filter((c) => isValidElement(c) && c.type === Tab);
  const rest = items2.filter((c) => !(isValidElement(c) && c.type === Tab));
  const firstValue = (() => {
    const first = tabs[0];
    return isValidElement(first) ? first.props.value : "";
  })();
  const [ownValue, setOwnValue] = useState5(defaultValue2 ?? firstValue);
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
  return /* @__PURE__ */ jsx10(TabsContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs10("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx10(
      "div",
      {
        ref: listRef,
        role: "tablist",
        "aria-label": label,
        onKeyDown,
        className: "flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800",
        children: tabs
      }
    ),
    rest
  ] }) });
}
function Tab({ value, disabled = false, badge, className, children }) {
  const ctx = useContext2(TabsContext);
  const active = ctx?.value === value;
  return /* @__PURE__ */ jsxs10(
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
        "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active ? "border-[color:var(--rm-accent)] text-neutral-900 dark:text-neutral-100" : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-200",
        focusRing,
        className
      ),
      children: [
        children,
        badge !== void 0 && /* @__PURE__ */ jsx10("span", { className: "rounded-full bg-neutral-100 px-1.5 text-xs font-normal text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300", children: badge })
      ]
    }
  );
}
function TabPanel({ value, className, children }) {
  const ctx = useContext2(TabsContext);
  const active = ctx?.value === value;
  if (!active) return null;
  return /* @__PURE__ */ jsx10(
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

// src/components/tooltip.tsx
import {
  Children as Children3,
  cloneElement,
  isValidElement as isValidElement2,
  useId as useId5,
  useState as useState6
} from "react";
import { jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
var SIDES = {
  top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-1.5 -translate-x-1/2",
  left: "right-full top-1/2 mr-1.5 -translate-y-1/2",
  right: "left-full top-1/2 ml-1.5 -translate-y-1/2"
};
function Tooltip({ content, side = "top", className, children }) {
  const [open, setOpen] = useState6(false);
  const id = useId5();
  const child = Children3.only(children);
  const described = isValidElement2(child) ? cloneElement(child, {
    "aria-describedby": open ? id : void 0
  }) : child;
  return /* @__PURE__ */ jsxs11(
    "span",
    {
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
        /* @__PURE__ */ jsx11(
          "span",
          {
            role: "tooltip",
            id,
            hidden: !open,
            className: cn(
              "pointer-events-none absolute z-40 w-max max-w-xs rounded-md bg-neutral-900 px-2 py-1 text-xs font-normal text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900",
              SIDES[side],
              className
            ),
            children: content
          }
        )
      ]
    }
  );
}

// src/components/data-table.tsx
import {
  useCallback as useCallback2,
  useEffect as useEffect6,
  useMemo,
  useRef as useRef4,
  useState as useState7
} from "react";

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
  if (isActionSource(source)) {
    return source.action.name ? { "data-rm-action": source.action.name } : {};
  }
  if (!source.name) return {};
  const ns = "records" in source ? "collection" : "action";
  return { [`data-rm-${ns}`]: source.name };
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

// src/components/empty-state.tsx
import { jsx as jsx12, jsxs as jsxs12 } from "react/jsx-runtime";
function EmptyState({ icon, title, description, action, className, ...props }) {
  return /* @__PURE__ */ jsxs12(
    "div",
    {
      className: cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center dark:border-neutral-700",
        className
      ),
      ...props,
      children: [
        icon !== void 0 ? /* @__PURE__ */ jsx12("div", { "aria-hidden": "true", className: "mb-1 text-neutral-400 dark:text-neutral-500", children: icon }) : /* @__PURE__ */ jsx12(
          "svg",
          {
            "aria-hidden": "true",
            className: "mb-1 h-8 w-8 text-neutral-300 dark:text-neutral-600",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            children: /* @__PURE__ */ jsx12(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                d: "M20 13V7a2 2 0 0 0-2-2h-3.5l-1-2h-3l-1 2H6a2 2 0 0 0-2 2v6m16 0v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4m16 0h-5a3 3 0 0 1-6 0H4"
              }
            )
          }
        ),
        /* @__PURE__ */ jsx12("h3", { className: "text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: title }),
        description !== void 0 && /* @__PURE__ */ jsx12("p", { className: "max-w-sm text-sm text-neutral-500 dark:text-neutral-400", children: description }),
        action !== void 0 && /* @__PURE__ */ jsx12("div", { className: "mt-3", children: action })
      ]
    }
  );
}

// src/components/error-state.tsx
import { AppError } from "@robomotion/apps-runtime";
import { jsx as jsx13, jsxs as jsxs13 } from "react/jsx-runtime";
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
function ErrorState({
  error,
  title,
  onRetry,
  retryLabel = "Try again",
  className,
  ...props
}) {
  const retryable = error instanceof AppError ? error.retryable : true;
  const heading = title ?? defaultTitle(error);
  return /* @__PURE__ */ jsxs13(
    "div",
    {
      role: "alert",
      className: cn(
        "flex flex-col items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-left dark:border-red-500/30 dark:bg-red-500/10",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsxs13("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx13(
            "svg",
            {
              "aria-hidden": "true",
              className: "h-5 w-5 shrink-0 text-red-500",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.75",
              children: /* @__PURE__ */ jsx13(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                }
              )
            }
          ),
          /* @__PURE__ */ jsx13("h3", { className: "text-sm font-semibold text-red-800 dark:text-red-300", children: heading })
        ] }),
        /* @__PURE__ */ jsx13("p", { className: "text-sm text-red-700 dark:text-red-300/90", children: messageOf(error) }),
        onRetry && retryable && /* @__PURE__ */ jsx13(Button, { variant: "secondary", size: "sm", className: "mt-1", onClick: onRetry, children: retryLabel })
      ]
    }
  );
}

// src/components/data-table.tsx
import { jsx as jsx14, jsxs as jsxs14 } from "react/jsx-runtime";
function isLinkedAction(a) {
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
function DataTable({
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
  tableRef
}) {
  const [filter, setFilter] = useState7("");
  const [sortKey, setSortKey] = useState7(null);
  const [sortDir, setSortDir] = useState7("asc");
  const [page, setPage] = useState7(0);
  const paged = !!source && isActionSource(source);
  const pagedAction = paged ? source.action : null;
  const actionName = pagedAction?.name ?? "";
  const actionRef = useRef4(pagedAction);
  actionRef.current = pagedAction;
  const effPageSize = paged ? source.pageSize ?? pageSize : pageSize;
  const [remote, setRemote] = useState7(null);
  const [remoteLoading, setRemoteLoading] = useState7(false);
  const [remoteError, setRemoteError] = useState7(null);
  const [reloadTick, setReloadTick] = useState7(0);
  const seq = useRef4(0);
  const ownFetch = useRef4(false);
  const [askedFilter, setAskedFilter] = useState7("");
  useEffect6(() => {
    if (!paged) return;
    const t = setTimeout(() => setAskedFilter(filter), 250);
    return () => clearTimeout(t);
  }, [filter, paged]);
  const paging = effPageSize > 0;
  const inMemoryTotal = useRef4(0);
  const total = paged ? remote?.total ?? 0 : inMemoryTotal.current;
  const pageCount = paging ? Math.max(1, Math.ceil(total / effPageSize)) : 1;
  const clampedPage = Math.min(page, pageCount - 1);
  const fetchPage = useCallback2(async () => {
    const action = actionRef.current;
    if (!action) return;
    const req = {
      filter: askedFilter,
      sort: sortKey ? { key: sortKey, dir: sortDir } : void 0,
      offset: clampedPage * (effPageSize || 0),
      limit: effPageSize
    };
    const mine = ++seq.current;
    ownFetch.current = true;
    setRemoteLoading(true);
    setRemoteError(null);
    try {
      const reply = await action.run(req);
      if (mine !== seq.current) return;
      setRemote(readPageReply(reply, req));
    } catch (e) {
      if (mine !== seq.current) return;
      setRemoteError(e);
      setRemote({ rows: [], total: 0 });
    } finally {
      if (mine === seq.current) setRemoteLoading(false);
    }
  }, [askedFilter, sortKey, sortDir, clampedPage, effPageSize]);
  useEffect6(() => {
    if (!paged || !actionName) return;
    void fetchPage();
  }, [paged, actionName, fetchPage, reloadTick]);
  const wasLoading = useRef4(false);
  useEffect6(() => {
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
  const refresh = useCallback2(() => setReloadTick((t) => t + 1), []);
  useEffect6(() => {
    if (!tableRef) return;
    tableRef.current = { refresh };
    return () => {
      tableRef.current = null;
    };
  }, [tableRef, refresh]);
  const filtered = useMemo(() => {
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
  const sorted = useMemo(() => {
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
  const pageRows = paged ? remote?.rows ?? NO_ROWS : paging ? sorted.slice(clampedPage * effPageSize, clampedPage * effPageSize + effPageSize) : sorted;
  useEffect6(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);
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
  const linkAttrs = useMemo(
    () => source ? sourceLinkAttrs(source) : rowsLinkAttrs(rows),
    [rows, source]
  );
  const columnCount = columns.length + (rowActions?.length ? 1 : 0);
  return /* @__PURE__ */ jsxs14("div", { className: cn("text-left", className), ...linkAttrs, children: [
    filterable && /* @__PURE__ */ jsx14("div", { className: "mb-3 max-w-xs", children: /* @__PURE__ */ jsx14(
      "input",
      {
        type: "search",
        "aria-label": filterPlaceholder,
        className: cn(inputBase, "h-9"),
        placeholder: filterPlaceholder,
        value: filter,
        onChange: (e) => {
          setFilter(e.target.value);
          setPage(0);
        }
      }
    ) }),
    /* @__PURE__ */ jsx14("div", { className: "overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxs14("table", { className: "w-full border-collapse bg-white text-sm dark:bg-neutral-900", children: [
      caption && /* @__PURE__ */ jsx14("caption", { className: "sr-only", children: caption }),
      /* @__PURE__ */ jsx14("thead", { children: /* @__PURE__ */ jsxs14("tr", { className: "border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60", children: [
        columns.map((col) => {
          const active = sortKey === col.key;
          return /* @__PURE__ */ jsx14(
            "th",
            {
              scope: "col",
              "aria-sort": active ? sortDir === "asc" ? "ascending" : "descending" : void 0,
              className: cn(
                "px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
                alignClass(col.align),
                col.className
              ),
              children: col.sortable ? /* @__PURE__ */ jsxs14(
                "button",
                {
                  type: "button",
                  onClick: () => toggleSort(col),
                  className: cn(
                    "inline-flex items-center gap-1 rounded uppercase tracking-wide hover:text-neutral-900 dark:hover:text-neutral-100",
                    focusRing,
                    active && "text-neutral-900 dark:text-neutral-100"
                  ),
                  children: [
                    col.header,
                    /* @__PURE__ */ jsx14(SortIcon, { active, dir: sortDir })
                  ]
                }
              ) : col.header
            },
            col.key
          );
        }),
        rowActions && rowActions.length > 0 && /* @__PURE__ */ jsx14("th", { scope: "col", className: "w-12 px-3 py-2.5", children: /* @__PURE__ */ jsx14("span", { className: "sr-only", children: "Actions" }) })
      ] }) }),
      /* @__PURE__ */ jsxs14("tbody", { children: [
        busy && /* @__PURE__ */ jsx14("tr", { children: /* @__PURE__ */ jsx14(
          "td",
          {
            colSpan: columnCount,
            className: "px-3 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400",
            children: "Loading"
          }
        ) }),
        !busy && pageRows.map((row, i) => {
          const key = rowKey ? rowKey(row) : String(clampedPage * effPageSize + i);
          return /* @__PURE__ */ jsxs14(
            "tr",
            {
              onClick: onRowClick ? () => onRowClick(row) : void 0,
              className: cn(
                "border-b border-neutral-100 last:border-b-0 dark:border-neutral-800",
                onRowClick && "cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
              ),
              children: [
                columns.map((col) => /* @__PURE__ */ jsx14(
                  "td",
                  {
                    className: cn(
                      "px-3 py-2.5 text-neutral-800 dark:text-neutral-200",
                      alignClass(col.align),
                      col.className
                    ),
                    children: col.render ? col.render(row) : cellText(defaultValue(row, col))
                  },
                  col.key
                )),
                rowActions && rowActions.length > 0 && /* @__PURE__ */ jsx14("td", { className: "px-2 py-1.5 text-right", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx14(Menu, { items: rowMenuItems(row, rowActions) }) })
              ]
            },
            key
          );
        }),
        showEmpty && /* @__PURE__ */ jsx14("tr", { children: /* @__PURE__ */ jsx14("td", { colSpan: columnCount, className: "p-0", children: remoteError ? /* @__PURE__ */ jsx14(ErrorState, { className: "m-3", error: remoteError, onRetry: refresh }) : emptyState ?? /* @__PURE__ */ jsx14(
          EmptyState,
          {
            className: "rounded-none border-0",
            title: emptyTitle,
            description: emptyDescription ?? (filter ? "No rows match the current filter." : void 0)
          }
        ) }) })
      ] })
    ] }) }),
    paging && total > effPageSize && /* @__PURE__ */ jsxs14(
      "nav",
      {
        "aria-label": "Table pagination",
        className: "mt-3 flex items-center justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-400",
        children: [
          /* @__PURE__ */ jsxs14("span", { children: [
            "Showing ",
            clampedPage * effPageSize + 1,
            " to",
            " ",
            Math.min((clampedPage + 1) * effPageSize, total),
            " of ",
            total
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx14(
              PagerButton,
              {
                label: "Previous page",
                disabled: clampedPage === 0,
                onClick: () => setPage(clampedPage - 1),
                children: "Previous"
              }
            ),
            /* @__PURE__ */ jsxs14("span", { "aria-current": "page", className: "tabular-nums", children: [
              clampedPage + 1,
              " / ",
              pageCount
            ] }),
            /* @__PURE__ */ jsx14(
              PagerButton,
              {
                label: "Next page",
                disabled: clampedPage >= pageCount - 1,
                onClick: () => setPage(clampedPage + 1),
                children: "Next"
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function rowMenuItems(row, actions) {
  return actions.map((a) => ({
    label: a.label,
    danger: a.danger,
    disabled: a.disabled?.(row) ?? false,
    action: isLinkedAction(a) ? a.action : void 0,
    params: isLinkedAction(a) ? a.params(row) : void 0,
    onSelect: isLinkedAction(a) ? void 0 : () => a.onSelect(row)
  }));
}
function cellText(v) {
  if (v === null || v === void 0 || v === "") {
    return /* @__PURE__ */ jsx14("span", { className: "text-neutral-400 dark:text-neutral-600", children: "-" });
  }
  return String(v);
}
function SortIcon({ active, dir }) {
  return /* @__PURE__ */ jsx14(
    "svg",
    {
      "aria-hidden": "true",
      className: cn("h-3 w-3", active ? "opacity-100" : "opacity-30"),
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      children: !active || dir === "asc" ? /* @__PURE__ */ jsx14("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m6 14 6-6 6 6" }) : /* @__PURE__ */ jsx14("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m6 10 6 6 6-6" })
    }
  );
}
function PagerButton({
  label,
  disabled,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx14(
    "button",
    {
      type: "button",
      "aria-label": label,
      disabled,
      onClick,
      className: cn(
        "rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
        focusRing
      ),
      children
    }
  );
}

// src/components/chart.tsx
import { useId as useId6 } from "react";
import { Fragment as Fragment2, jsx as jsx15, jsxs as jsxs15 } from "react/jsx-runtime";
var WIDTH = 480;
function seriesOpacity(i, n) {
  if (n <= 1) return 1;
  const step = 0.7 / Math.max(1, n - 1);
  return Number((1 - i * step).toFixed(3));
}
function Chart({
  kind,
  data,
  title,
  description,
  height = 220,
  formatValue,
  emptyState,
  source,
  className
}) {
  const id = useId6();
  const fmt = formatValue ?? ((v) => v.toLocaleString());
  const linkAttrs = source ? sourceLinkAttrs(source) : {};
  if (!data || data.length === 0) {
    return /* @__PURE__ */ jsx15(
      "div",
      {
        className: cn(
          "rounded-lg border border-dashed border-neutral-300 px-6 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400",
          className
        ),
        ...linkAttrs,
        children: emptyState ?? "Nothing to chart yet."
      }
    );
  }
  const total = data.reduce((sum, d) => sum + (Number.isFinite(d.value) ? d.value : 0), 0);
  const desc = description ?? `${kind} chart, ${data.length} ${data.length === 1 ? "value" : "values"}: ` + data.slice(0, 8).map((d) => `${d.label} ${fmt(d.value)}`).join(", ") + (data.length > 8 ? ", and more" : "");
  return /* @__PURE__ */ jsx15("div", { className: cn("text-left", className), ...linkAttrs, children: /* @__PURE__ */ jsxs15("div", { className: kind === "pie" ? "flex flex-wrap items-center gap-6" : void 0, children: [
    /* @__PURE__ */ jsxs15(
      "svg",
      {
        role: "img",
        "aria-labelledby": `${id}-t ${id}-d`,
        viewBox: `0 0 ${WIDTH} ${height}`,
        className: cn("h-auto", kind === "pie" ? "w-48 max-w-full" : "w-full"),
        children: [
          /* @__PURE__ */ jsx15("title", { id: `${id}-t`, children: title ?? "Chart" }),
          /* @__PURE__ */ jsx15("desc", { id: `${id}-d`, children: desc }),
          kind === "bar" && /* @__PURE__ */ jsx15(Bars, { data, height, fmt }),
          kind === "line" && /* @__PURE__ */ jsx15(Line, { data, height, fmt }),
          kind === "pie" && /* @__PURE__ */ jsx15(Pie, { data, height, total })
        ]
      }
    ),
    kind === "pie" && /* @__PURE__ */ jsx15("ul", { className: "min-w-0 flex-1 space-y-1 text-sm", children: data.map((d, i) => /* @__PURE__ */ jsxs15("li", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx15(
        "span",
        {
          "aria-hidden": "true",
          className: "h-3 w-3 shrink-0 rounded-sm bg-[color:var(--rm-accent)]",
          style: { opacity: seriesOpacity(i, data.length) }
        }
      ),
      /* @__PURE__ */ jsx15("span", { className: "min-w-0 flex-1 truncate text-neutral-700 dark:text-neutral-300", children: d.label }),
      /* @__PURE__ */ jsx15("span", { className: "tabular-nums text-neutral-500 dark:text-neutral-400", children: fmt(d.value) })
    ] }, `${d.label}-${i}`)) })
  ] }) });
}
var PAD = { top: 14, right: 8, bottom: 26, left: 8 };
function scale(data, height) {
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const values = data.map((d) => Number.isFinite(d.value) ? d.value : 0);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const y = (v) => PAD.top + plotH - (v - min) / span * plotH;
  return { plotW, plotH, max, min, y, values };
}
var axisLine = "stroke-neutral-200 dark:stroke-neutral-800";
var axisText = "fill-neutral-500 dark:fill-neutral-400";
function Bars({ data, height, fmt }) {
  const { plotW, y, values } = scale(data, height);
  const slot = plotW / data.length;
  const barW = Math.max(4, Math.min(48, slot * 0.62));
  const base2 = y(0);
  return /* @__PURE__ */ jsxs15(Fragment2, { children: [
    /* @__PURE__ */ jsx15("line", { x1: PAD.left, y1: base2, x2: WIDTH - PAD.right, y2: base2, className: axisLine, strokeWidth: 1 }),
    data.map((d, i) => {
      const v = values[i];
      const cx2 = PAD.left + (i + 0.5) * slot;
      const top = y(v);
      const h = Math.abs(base2 - top);
      return /* @__PURE__ */ jsxs15("g", { children: [
        /* @__PURE__ */ jsx15(
          "rect",
          {
            x: cx2 - barW / 2,
            y: Math.min(top, base2),
            width: barW,
            height: Math.max(h, v === 0 ? 0 : 1),
            rx: 2,
            fill: "var(--rm-accent)",
            fillOpacity: seriesOpacity(i, data.length)
          }
        ),
        /* @__PURE__ */ jsx15("text", { x: cx2, y: Math.min(top, base2) - 4, textAnchor: "middle", fontSize: 10, className: axisText, children: fmt(v) }),
        /* @__PURE__ */ jsx15("text", { x: cx2, y: height - 8, textAnchor: "middle", fontSize: 10, className: axisText, children: clip(d.label, Math.floor(slot / 6)) })
      ] }, `${d.label}-${i}`);
    })
  ] });
}
function Line({ data, height, fmt }) {
  const { plotW, y, values, min } = scale(data, height);
  const x = (i) => PAD.left + (data.length === 1 ? plotW / 2 : i * plotW / (data.length - 1));
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `M ${x(0)},${y(min)} L ${points.split(" ").join(" L ")} L ${x(values.length - 1)},${y(min)} Z`;
  const every = Math.max(1, Math.ceil(data.length / 6));
  return /* @__PURE__ */ jsxs15(Fragment2, { children: [
    /* @__PURE__ */ jsx15(
      "line",
      {
        x1: PAD.left,
        y1: height - PAD.bottom,
        x2: WIDTH - PAD.right,
        y2: height - PAD.bottom,
        className: axisLine,
        strokeWidth: 1
      }
    ),
    /* @__PURE__ */ jsx15("path", { d: area, fill: "var(--rm-accent)", fillOpacity: 0.12 }),
    /* @__PURE__ */ jsx15(
      "polyline",
      {
        points,
        fill: "none",
        stroke: "var(--rm-accent)",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    ),
    values.map((v, i) => /* @__PURE__ */ jsxs15("g", { children: [
      /* @__PURE__ */ jsx15("circle", { cx: x(i), cy: y(v), r: 2.5, fill: "var(--rm-accent)" }),
      i % every === 0 && /* @__PURE__ */ jsxs15(Fragment2, { children: [
        /* @__PURE__ */ jsx15("text", { x: x(i), y: y(v) - 7, textAnchor: "middle", fontSize: 10, className: axisText, children: fmt(v) }),
        /* @__PURE__ */ jsx15("text", { x: x(i), y: height - 8, textAnchor: "middle", fontSize: 10, className: axisText, children: clip(data[i].label, 10) })
      ] })
    ] }, `${data[i].label}-${i}`))
  ] });
}
function Pie({ data, height, total }) {
  const r = Math.max(10, Math.min(WIDTH, height) / 2 - 8);
  const cx2 = WIDTH / 2;
  const cy = height / 2;
  if (total <= 0) {
    return /* @__PURE__ */ jsx15("circle", { cx: cx2, cy, r, fill: "var(--rm-accent)", fillOpacity: 0.15 });
  }
  let angle = -Math.PI / 2;
  return /* @__PURE__ */ jsx15(Fragment2, { children: data.map((d, i) => {
    const share = Math.max(0, d.value) / total;
    const sweep = share * Math.PI * 2;
    const start = angle;
    angle += sweep;
    if (share >= 0.9999) {
      return /* @__PURE__ */ jsx15("circle", { cx: cx2, cy, r, fill: "var(--rm-accent)", fillOpacity: 1 }, `${d.label}-${i}`);
    }
    if (share <= 0) return null;
    const x1 = cx2 + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx2 + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return /* @__PURE__ */ jsx15(
      "path",
      {
        d: `M ${cx2},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} Z`,
        fill: "var(--rm-accent)",
        fillOpacity: seriesOpacity(i, data.length)
      },
      `${d.label}-${i}`
    );
  }) });
}
function clip(text, max) {
  if (max <= 1 || text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1))}\u2026`;
}

// src/components/kanban.tsx
import {
  Children as Children4,
  createContext as createContext3,
  isValidElement as isValidElement3,
  useContext as useContext3,
  useEffect as useEffect7,
  useRef as useRef5,
  useState as useState8
} from "react";
import { jsx as jsx16, jsxs as jsxs16 } from "react/jsx-runtime";
var KanbanContext = createContext3(null);
function Kanban({ onMove, action, className, children }) {
  const items2 = Children4.toArray(children);
  const columns = [];
  for (const c of items2) {
    if (isValidElement3(c) && c.type === KanbanColumn) columns.push(String(c.props.id));
  }
  const [dragKey, setDragKey] = useState8(null);
  const [dragFrom, setDragFrom] = useState8(null);
  const [dragOffset, setDragOffset] = useState8({ x: 0, y: 0 });
  const [overColumn, setOverColumn] = useState8(null);
  const origin = useRef5({ x: 0, y: 0 });
  const latest = useRef5({
    key: "",
    from: "",
    over: null
  });
  const move = (key, from, to) => {
    if (!key || !to || from === to) return;
    const m = { key, from, to };
    onMove?.(m);
    if (action) void Promise.resolve(action.run(m)).catch(() => void 0);
  };
  const startDrag = (key, from, at) => {
    origin.current = at;
    latest.current = { key, from, over: null };
    setDragKey(key);
    setDragFrom(from);
    setDragOffset({ x: 0, y: 0 });
    setOverColumn(null);
  };
  useEffect7(() => {
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
  return /* @__PURE__ */ jsx16(KanbanContext.Provider, { value: ctx, children: /* @__PURE__ */ jsx16(
    "div",
    {
      className: cn("flex gap-4 overflow-x-auto pb-2 text-left", className),
      "data-rm-action": action?.name,
      children: items2
    }
  ) });
}
function KanbanColumn({ id, title, meta, emptyState, className, children }) {
  const ctx = useContext3(KanbanContext);
  const over = ctx?.overColumn === id && ctx?.dragFrom !== id;
  const cards = Children4.toArray(children);
  return /* @__PURE__ */ jsxs16(
    "section",
    {
      "data-rm-kanban-column": id,
      "aria-label": typeof title === "string" ? title : void 0,
      className: cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-neutral-50 transition-colors dark:bg-neutral-900/60",
        over ? "border-[color:var(--rm-accent)] bg-[color:var(--rm-accent)]/5" : "border-neutral-200 dark:border-neutral-800",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs16("header", { className: "flex items-center justify-between gap-2 px-3 py-2", children: [
          /* @__PURE__ */ jsx16("h3", { className: "text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: title }),
          /* @__PURE__ */ jsx16("span", { className: "text-xs text-neutral-500 dark:text-neutral-400", children: meta ?? cards.length })
        ] }),
        /* @__PURE__ */ jsx16("ul", { className: "flex min-h-[4rem] flex-1 flex-col gap-2 p-2", children: cards.length > 0 ? cards : /* @__PURE__ */ jsx16("li", { className: "rounded-md border border-dashed border-neutral-300 px-3 py-6 text-center text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400", children: emptyState ?? "Nothing here" }) })
      ]
    }
  );
}
function KanbanCard({ id, column, disabled = false, className, children }) {
  const ctx = useContext3(KanbanContext);
  const ref = useRef5(null);
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
  return /* @__PURE__ */ jsx16(
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
        "relative rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-grab",
        dragging && "z-50 rotate-1 cursor-grabbing shadow-lg",
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
import { useMemo as useMemo2, useState as useState9 } from "react";
import { Fragment as Fragment3, jsx as jsx17, jsxs as jsxs17 } from "react/jsx-runtime";
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
  const [ownMonth, setOwnMonth] = useState9(
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
  const byDate = useMemo2(() => {
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
  const shift = weekStartsOn === "monday" ? 1 : 0;
  const lead = (firstDay.getDay() - shift + 7) % 7;
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + i + shift);
    return d.toLocaleDateString(void 0, { weekday: "short" });
  });
  const heading = firstDay.toLocaleDateString(void 0, { month: "long", year: "numeric" });
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());
  return /* @__PURE__ */ jsxs17("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsxs17("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx17(NavButton, { label: "Previous month", onClick: () => goto(-1), dir: "prev" }),
      /* @__PURE__ */ jsx17("h3", { className: "text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: heading }),
      /* @__PURE__ */ jsx17(NavButton, { label: "Next month", onClick: () => goto(1), dir: "next" })
    ] }),
    /* @__PURE__ */ jsxs17(
      "div",
      {
        role: "group",
        "aria-label": heading,
        className: "overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800",
        children: [
          /* @__PURE__ */ jsx17("div", { "aria-hidden": "true", className: "grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60", children: weekdays.map((w) => /* @__PURE__ */ jsx17(
            "div",
            {
              className: "px-2 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
              children: w
            },
            w
          )) }),
          /* @__PURE__ */ jsx17("div", { className: "grid grid-cols-7 bg-white dark:bg-neutral-900", children: cells.map((day, i) => {
            if (day === null) {
              return /* @__PURE__ */ jsx17("div", { className: "min-h-[4.5rem] border-b border-r border-neutral-100 last:border-r-0 dark:border-neutral-800" }, `pad-${i}`);
            }
            const date = iso(year, monthIndex, day);
            const dayEvents = byDate.get(date) ?? [];
            const isSelected = selected === date;
            const isToday = date === todayIso;
            const body = /* @__PURE__ */ jsxs17(Fragment3, { children: [
              /* @__PURE__ */ jsx17(
                "span",
                {
                  className: cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs tabular-nums",
                    isSelected && "bg-[color:var(--rm-accent)] font-semibold text-white",
                    !isSelected && isToday && "font-semibold text-[color:var(--rm-accent)]",
                    !isSelected && !isToday && "text-neutral-600 dark:text-neutral-400"
                  ),
                  children: day
                }
              ),
              /* @__PURE__ */ jsxs17("span", { className: "mt-1 flex flex-col gap-0.5", children: [
                dayEvents.slice(0, maxPerDay).map((e, j) => /* @__PURE__ */ jsx17(
                  "span",
                  {
                    className: "truncate rounded bg-[color:var(--rm-accent)]/10 px-1 py-0.5 text-[11px] text-neutral-800 dark:text-neutral-200",
                    children: e.label
                  },
                  j
                )),
                dayEvents.length > maxPerDay && /* @__PURE__ */ jsxs17("span", { className: "px-1 text-[11px] text-neutral-500 dark:text-neutral-400", children: [
                  "+",
                  dayEvents.length - maxPerDay,
                  " more"
                ] })
              ] })
            ] });
            const cellClass = cn(
              "flex min-h-[4.5rem] flex-col border-b border-r border-neutral-100 p-1.5 text-left last:border-r-0 dark:border-neutral-800",
              isSelected && "bg-[color:var(--rm-accent)]/5"
            );
            if (!onSelect) {
              return /* @__PURE__ */ jsx17("div", { className: cellClass, children: body }, date);
            }
            const fullDate = new Date(year, monthIndex, day).toLocaleDateString(void 0, {
              dateStyle: "full"
            });
            return /* @__PURE__ */ jsx17(
              "button",
              {
                type: "button",
                "aria-pressed": isSelected,
                onClick: () => onSelect(date, dayEvents),
                "aria-label": `${fullDate}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`,
                className: cn(
                  cellClass,
                  "transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
                  focusRing
                ),
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
  return /* @__PURE__ */ jsx17(
    "button",
    {
      type: "button",
      "aria-label": label,
      onClick,
      className: cn(
        "rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        focusRing
      ),
      children: /* @__PURE__ */ jsx17("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx17(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: dir === "prev" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"
        }
      ) })
    }
  );
}

// src/components/markdown.tsx
import { jsx as jsx18 } from "react/jsx-runtime";
var prose = cn(
  "text-sm leading-relaxed text-neutral-800 dark:text-neutral-200",
  "[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-semibold [&_h1:first-child]:mt-0",
  "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2:first-child]:mt-0",
  "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3:first-child]:mt-0",
  "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1",
  "[&_a]:text-[color:var(--rm-accent)] [&_a]:underline [&_a]:underline-offset-2",
  "[&_strong]:font-semibold [&_em]:italic",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-600 dark:[&_blockquote]:border-neutral-700 dark:[&_blockquote]:text-neutral-400",
  "[&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] dark:[&_code]:bg-neutral-800",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-neutral-100 [&_pre]:p-3 dark:[&_pre]:bg-neutral-800",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left",
  "[&_th]:border-b [&_th]:border-neutral-200 [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold dark:[&_th]:border-neutral-700",
  "[&_td]:border-b [&_td]:border-neutral-100 [&_td]:px-2 [&_td]:py-1 dark:[&_td]:border-neutral-800",
  "[&_hr]:my-4 [&_hr]:border-neutral-200 dark:[&_hr]:border-neutral-800"
);
function Markdown({ children, streaming = false, className }) {
  return /* @__PURE__ */ jsx18("div", { className: cn(prose, "text-left", className), children: /* @__PURE__ */ jsx18(Xa, { mode: "streaming", isAnimating: streaming, children: children ?? "" }) });
}

// src/components/json-view.tsx
import { useState as useState10 } from "react";
import { jsx as jsx19, jsxs as jsxs18 } from "react/jsx-runtime";
function isEmpty(value) {
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
  const [copied, setCopied] = useState10(false);
  if (isEmpty(value)) {
    return /* @__PURE__ */ jsx19(
      "div",
      {
        className: cn(
          "rounded-md border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400",
          className
        ),
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
  return /* @__PURE__ */ jsxs18(
    "div",
    {
      className: cn(
        "relative rounded-md border border-neutral-200 bg-neutral-50 p-3 text-left font-mono text-xs leading-relaxed dark:border-neutral-800 dark:bg-neutral-900/60",
        className
      ),
      children: [
        copyable && /* @__PURE__ */ jsx19(
          "button",
          {
            type: "button",
            onClick: copy,
            "aria-label": copied ? "Copied" : "Copy as JSON",
            className: cn(
              "absolute right-2 top-2 rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-sans text-[11px] text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
              focusRing
            ),
            children: copied ? "Copied" : "Copy"
          }
        ),
        /* @__PURE__ */ jsx19("ul", { role: "tree", "aria-label": label, className: cn("m-0 list-none p-0", copyable && "pr-14"), children: /* @__PURE__ */ jsx19(Node, { name: null, value, depth: 0, maxDepth }) })
      ]
    }
  );
}
function Node({
  name,
  value,
  depth,
  maxDepth
}) {
  const branch = value !== null && typeof value === "object";
  const [open, setOpen] = useState10(depth < maxDepth);
  if (!branch) {
    return /* @__PURE__ */ jsxs18("li", { role: "treeitem", className: "whitespace-pre-wrap break-words", children: [
      name !== null && /* @__PURE__ */ jsx19(Key, { name }),
      /* @__PURE__ */ jsx19(Leaf, { value })
    ] });
  }
  const array = Array.isArray(value);
  const entries = array ? value.map((v, i) => [String(i), v]) : Object.entries(value);
  const summary = array ? `[${entries.length} ${entries.length === 1 ? "item" : "items"}]` : `{${entries.length} ${entries.length === 1 ? "field" : "fields"}}`;
  return /* @__PURE__ */ jsxs18("li", { role: "treeitem", "aria-expanded": open, children: [
    /* @__PURE__ */ jsxs18(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        className: cn(
          "inline-flex max-w-full items-center gap-1 rounded text-left text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
          focusRing
        ),
        children: [
          /* @__PURE__ */ jsx19("span", { "aria-hidden": "true", className: cn("transition-transform", open && "rotate-90"), children: "\u203A" }),
          name !== null ? /* @__PURE__ */ jsx19(Key, { name }) : null,
          /* @__PURE__ */ jsx19("span", { className: "text-neutral-400 dark:text-neutral-500", children: summary })
        ]
      }
    ),
    open && /* @__PURE__ */ jsx19("ul", { role: "group", className: "m-0 list-none border-l border-neutral-200 pl-3 dark:border-neutral-800", children: entries.map(([key, v]) => /* @__PURE__ */ jsx19(Node, { name: key, value: v, depth: depth + 1, maxDepth }, key)) })
  ] });
}
function Key({ name }) {
  return /* @__PURE__ */ jsxs18("span", { className: "text-neutral-500 dark:text-neutral-400", children: [
    name,
    ": "
  ] });
}
function Leaf({ value }) {
  if (typeof value === "string") {
    return /* @__PURE__ */ jsxs18("span", { className: "text-emerald-700 dark:text-emerald-400", children: [
      '"',
      value,
      '"'
    ] });
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return /* @__PURE__ */ jsx19("span", { className: "text-blue-700 dark:text-blue-400", children: String(value) });
  }
  if (typeof value === "boolean") {
    return /* @__PURE__ */ jsx19("span", { className: "text-purple-700 dark:text-purple-400", children: String(value) });
  }
  if (value === null) return /* @__PURE__ */ jsx19("span", { className: "text-neutral-400 dark:text-neutral-500", children: "null" });
  if (value === void 0) return /* @__PURE__ */ jsx19("span", { className: "text-neutral-400 dark:text-neutral-500", children: "-" });
  return /* @__PURE__ */ jsx19("span", { className: "text-neutral-700 dark:text-neutral-300", children: String(value) });
}

// src/components/form.tsx
import {
  createContext as createContext4,
  useCallback as useCallback3,
  useContext as useContext4,
  useEffect as useEffect8,
  useId as useId7,
  useMemo as useMemo3,
  useRef as useRef6,
  useState as useState11
} from "react";
import { jsx as jsx20, jsxs as jsxs19 } from "react/jsx-runtime";
var FormContext = createContext4(null);
var FieldContext = createContext4(null);
function validateAgainstSchema(schema, values) {
  const errors = {};
  if (!schema || schema.type !== "object" || !schema.properties) return errors;
  const required = new Set(schema.required ?? []);
  for (const [name, prop] of Object.entries(schema.properties)) {
    const value = values[name];
    const empty = value === void 0 || value === null || typeof value === "string" && value.trim() === "";
    if (empty) {
      if (required.has(name)) errors[name] = "This field is required.";
      continue;
    }
    if (prop.enum && !prop.enum.some((v) => v === value)) {
      errors[name] = "Pick one of the allowed values.";
      continue;
    }
    switch (prop.type) {
      case "number":
        if (typeof value !== "number" || Number.isNaN(value)) errors[name] = "Enter a number.";
        break;
      case "integer":
        if (typeof value !== "number" || !Number.isInteger(value)) {
          errors[name] = "Enter a whole number.";
        }
        break;
      case "boolean":
        if (typeof value !== "boolean") errors[name] = "This must be on or off.";
        break;
      case "string":
        if (typeof value !== "string") errors[name] = "Enter text.";
        break;
      default:
        break;
    }
  }
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
  const [ownValues, setOwnValues] = useState11(initialValues ?? {});
  const [errors, setErrors] = useState11({});
  const values = controlledValues ?? ownValues;
  const formRef = useRef6(null);
  useEffect8(() => {
    const form = formRef.current;
    if (!form || !action) return;
    const target = submitControlOf(form) ?? form;
    const current = (target.getAttribute("data-rm-action") ?? "").split(/\s+/).filter(Boolean);
    if (!current.includes(action.name)) {
      target.setAttribute("data-rm-action", [...current, action.name].join(" "));
    }
  });
  const latest = useRef6(values);
  latest.current = values;
  const setValue = useCallback3(
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
  const ctx = useMemo3(
    () => ({ values, errors, disabled, setValue }),
    [values, errors, disabled, setValue]
  );
  return /* @__PURE__ */ jsx20(FormContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs19(
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
              return originalRun.call(action, params);
            });
          }
          try {
            void onSubmit?.(values);
          } finally {
            if (action && originalRun) action.run = originalRun;
          }
          if (action && !ranInSubmit) void Promise.resolve(action.run(values)).catch(() => void 0);
        }
      },
      ...props,
      children: [
        children,
        !hideError && action?.error ? /* @__PURE__ */ jsx20(ErrorState, { error: action.error, className: "mt-3" }) : null
      ]
    }
  ) });
}
function useFormValues() {
  return useContext4(FormContext)?.values ?? {};
}
function Field({ name, label, help, required = false, error, className, children }) {
  const form = useContext4(FormContext);
  const id = useId7();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const shownError = error ?? form?.errors[name];
  const describedBy = [help !== void 0 ? helpId : null, shownError ? errorId : null].filter(Boolean).join(" ") || void 0;
  const ctx = useMemo3(
    () => ({ name, id, describedBy, invalid: Boolean(shownError), required }),
    [name, id, describedBy, shownError, required]
  );
  return /* @__PURE__ */ jsx20(FieldContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs19("div", { className: cn("flex flex-col gap-1.5", className), children: [
    /* @__PURE__ */ jsxs19("label", { htmlFor: id, className: "text-sm font-medium text-neutral-800 dark:text-neutral-200", children: [
      label,
      required && /* @__PURE__ */ jsx20("span", { "aria-hidden": "true", className: "ml-0.5 text-red-500", children: "*" })
    ] }),
    children,
    help !== void 0 && /* @__PURE__ */ jsx20("p", { id: helpId, className: "text-xs text-neutral-500 dark:text-neutral-400", children: help }),
    shownError && /* @__PURE__ */ jsx20("p", { id: errorId, className: "text-xs font-medium text-red-600 dark:text-red-400", children: shownError })
  ] }) });
}
function useControl(explicitId) {
  const form = useContext4(FormContext);
  const field = useContext4(FieldContext);
  const fallbackId = useId7();
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
  return /* @__PURE__ */ jsx20(
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
  return /* @__PURE__ */ jsx20(
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
  return /* @__PURE__ */ jsx20(
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
  useEffect8(() => {
    if (seed !== void 0) write(seed);
  }, [seed]);
  return /* @__PURE__ */ jsxs19(
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
        placeholder !== void 0 && /* @__PURE__ */ jsx20("option", { value: "", disabled: true, children: placeholder }),
        options.map((opt) => /* @__PURE__ */ jsx20("option", { value: opt.value, disabled: opt.disabled, children: opt.label }, opt.value))
      ]
    }
  );
}
function Checkbox({ checked, onChange, label, className, id, disabled, ...props }) {
  const c = useControl(id);
  const current = checked ?? Boolean(c.read());
  return /* @__PURE__ */ jsxs19(
    "label",
    {
      className: cn(
        "inline-flex cursor-pointer select-none items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200",
        (disabled || c.disabled) && "cursor-not-allowed opacity-60",
        className
      ),
      children: [
        /* @__PURE__ */ jsx20(
          "input",
          {
            id: c.id,
            type: "checkbox",
            className: cn(
              "h-4 w-4 rounded border-neutral-300 text-[color:var(--rm-accent)] accent-[var(--rm-accent)] dark:border-neutral-600",
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
  return /* @__PURE__ */ jsx20(
    "div",
    {
      role: "radiogroup",
      "aria-describedby": c.ariaProps["aria-describedby"],
      "aria-invalid": c.ariaProps["aria-invalid"],
      className: cn("flex flex-col gap-2", className),
      children: options.map((opt) => /* @__PURE__ */ jsxs19(
        "label",
        {
          className: cn(
            "inline-flex cursor-pointer select-none items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200",
            (disabled || c.disabled || opt.disabled) && "cursor-not-allowed opacity-60"
          ),
          children: [
            /* @__PURE__ */ jsx20(
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
                  "h-4 w-4 border-neutral-300 text-[color:var(--rm-accent)] accent-[var(--rm-accent)] dark:border-neutral-600",
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
  return /* @__PURE__ */ jsx20(
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

// src/components/json-input.tsx
import { useEffect as useEffect9, useRef as useRef7, useState as useState12 } from "react";
import { jsx as jsx21, jsxs as jsxs20 } from "react/jsx-runtime";
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
  const [text, setText] = useState12(() => print(bound));
  const [invalid, setInvalid] = useState12(false);
  const ownWrite = useRef7(print(bound));
  useEffect9(() => {
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
  return /* @__PURE__ */ jsxs20("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsx21(
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
    invalid && /* @__PURE__ */ jsx21("p", { id: errorId, role: "alert", className: "text-xs font-medium text-red-600 dark:text-red-400", children: invalidMessage })
  ] });
}

// src/components/file-upload.tsx
import { useEffect as useEffect10, useRef as useRef8, useState as useState13 } from "react";
import { markGesture } from "@robomotion/apps-runtime";
import { useFileUpload } from "@robomotion/apps-runtime/react";

// src/components/progress.tsx
import { Fragment as Fragment4, jsx as jsx22, jsxs as jsxs21 } from "react/jsx-runtime";
function Progress({ value, label, showValue = false, className, ...props }) {
  const determinate = typeof value === "number" && Number.isFinite(value);
  const clamped = determinate ? Math.min(100, Math.max(0, value)) : 0;
  return /* @__PURE__ */ jsxs21("div", { className: cn("w-full", className), ...props, children: [
    (label || showValue && determinate) && /* @__PURE__ */ jsxs21("div", { className: "mb-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400", children: [
      /* @__PURE__ */ jsx22("span", { children: label }),
      showValue && determinate && /* @__PURE__ */ jsxs21("span", { children: [
        Math.round(clamped),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsx22(
      "div",
      {
        role: "progressbar",
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": determinate ? Math.round(clamped) : void 0,
        className: "h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800",
        children: determinate ? /* @__PURE__ */ jsx22(
          "div",
          {
            className: "h-full rounded-full bg-[color:var(--rm-accent)] transition-[width] duration-300",
            style: { width: `${clamped}%` }
          }
        ) : /* @__PURE__ */ jsxs21(Fragment4, { children: [
          /* @__PURE__ */ jsx22("style", { children: `@keyframes rm-indeterminate{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}` }),
          /* @__PURE__ */ jsx22(
            "div",
            {
              className: "h-full w-1/3 rounded-full bg-[color:var(--rm-accent)]",
              style: { animation: "rm-indeterminate 1.2s ease-in-out infinite" }
            }
          )
        ] })
      }
    )
  ] });
}

// src/components/file-upload.tsx
import { jsx as jsx23, jsxs as jsxs22 } from "react/jsx-runtime";
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
  const { upload, uploading, progress, error } = useFileUpload();
  const inputRef = useRef8(null);
  const zoneRef = useRef8(null);
  const [dragOver, setDragOver] = useState13(false);
  const [uploaded, setUploaded] = useState13(null);
  const onErrorRef = useRef8(onError);
  onErrorRef.current = onError;
  useEffect10(() => {
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
        void Promise.resolve(action.run({ file: ref, ...extra ?? {} })).catch(() => void 0);
      }
    }
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    void start(e.dataTransfer.files?.[0]);
  };
  return /* @__PURE__ */ jsxs22("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx23(
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
    /* @__PURE__ */ jsxs22(
      "button",
      {
        ref: zoneRef,
        type: "button",
        "data-rm-dropzone": "",
        "data-rm-action": action?.name,
        disabled: disabled || uploading,
        onClick: () => inputRef.current?.click(),
        onDragOver: (e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        },
        onDragLeave: () => setDragOver(false),
        onDrop,
        className: cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
          focusRing,
          dragOver ? "border-[color:var(--rm-accent)] bg-orange-50/50 dark:bg-neutral-800" : "border-neutral-300 bg-white hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600",
          (disabled || uploading) && "cursor-not-allowed opacity-60"
        ),
        children: [
          /* @__PURE__ */ jsx23(
            "svg",
            {
              "aria-hidden": "true",
              className: "h-7 w-7 text-neutral-400 dark:text-neutral-500",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.5",
              children: /* @__PURE__ */ jsx23(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                }
              )
            }
          ),
          /* @__PURE__ */ jsx23("span", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-300", children: label }),
          hint && /* @__PURE__ */ jsx23("span", { className: "text-xs text-neutral-500 dark:text-neutral-400", children: hint })
        ]
      }
    ),
    uploading && /* @__PURE__ */ jsx23("div", { className: "mt-3", children: /* @__PURE__ */ jsx23(Progress, { value: progress, label: "Uploading", showValue: true }) }),
    !uploading && uploaded && /* @__PURE__ */ jsxs22("p", { className: "mt-2 flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400", children: [
      /* @__PURE__ */ jsx23("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx23("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m5 13 4 4L19 7" }) }),
      uploaded.name,
      " uploaded"
    ] }),
    !uploading && error && /* @__PURE__ */ jsx23("p", { role: "alert", className: "mt-2 text-sm font-medium text-red-600 dark:text-red-400", children: error.message })
  ] });
}

// src/components/skeleton.tsx
import { jsx as jsx24 } from "react/jsx-runtime";
var base = "animate-pulse bg-neutral-200 dark:bg-neutral-800";
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
    return /* @__PURE__ */ jsx24("div", { className: cn("flex flex-col gap-2", className), "aria-hidden": "true", style, ...props, children: Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsx24(
      "div",
      {
        className: cn(base, "h-4 rounded"),
        style: { width: i === lines - 1 ? "60%" : width ?? "100%" }
      },
      i
    )) });
  }
  return /* @__PURE__ */ jsx24(
    "div",
    {
      "aria-hidden": "true",
      className: cn(
        base,
        variant === "circle" ? "rounded-full" : "rounded",
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

// src/components/status-badge.tsx
import { jsx as jsx25, jsxs as jsxs23 } from "react/jsx-runtime";
var STYLES = {
  ok: {
    pill: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/30",
    dot: "bg-green-500",
    label: "OK"
  },
  warn: {
    pill: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
    dot: "bg-amber-500",
    label: "Warning"
  },
  error: {
    pill: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
    dot: "bg-red-500",
    label: "Error"
  },
  pending: {
    pill: "bg-neutral-100 text-neutral-600 ring-neutral-500/20 dark:bg-neutral-500/10 dark:text-neutral-300 dark:ring-neutral-400/30",
    dot: "bg-neutral-400",
    label: "Pending"
  }
};
function StatusBadge({ status, children, className, ...props }) {
  const s = STYLES[status];
  return /* @__PURE__ */ jsxs23(
    "span",
    {
      className: cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.pill,
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx25("span", { "aria-hidden": "true", className: cn("h-1.5 w-1.5 rounded-full", s.dot) }),
        children ?? s.label
      ]
    }
  );
}

// src/components/layout.tsx
import { jsx as jsx26 } from "react/jsx-runtime";
var GAP = {
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
  return /* @__PURE__ */ jsx26(
    "div",
    {
      className: cn("flex flex-col", GAP[gap], align && ALIGN[align], className),
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
  return /* @__PURE__ */ jsx26(
    "div",
    {
      className: cn(
        "flex flex-row",
        GAP[gap],
        ALIGN[align],
        justify && JUSTIFY[justify],
        wrap && "flex-wrap",
        className
      ),
      ...props
    }
  );
}
var COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6"
};
var MD_COLS = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  6: "md:grid-cols-6"
};
var LG_COLS = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6"
};
function Grid({ className, gap = 4, cols = 1, mdCols, lgCols, ...props }) {
  return /* @__PURE__ */ jsx26(
    "div",
    {
      className: cn(
        "grid",
        GAP[gap],
        COLS[cols],
        mdCols && MD_COLS[mdCols],
        lgCols && LG_COLS[lgCols],
        className
      ),
      ...props
    }
  );
}

// src/components/assistant-widget.tsx
import { useEffect as useEffect11, useRef as useRef9, useState as useState14 } from "react";
import { useAssistant, useMaybeAppClient as useMaybeAppClient2 } from "@robomotion/apps-runtime/react";
import { jsx as jsx27, jsxs as jsxs24 } from "react/jsx-runtime";
var STORAGE_OPEN = "rm.app.assistant.open";
var assistantProse = cn(
  "[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
  "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
  "[&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:my-1 [&_h2]:my-1 [&_h3]:my-1",
  "[&_strong]:font-semibold [&_a]:underline [&_hr]:my-2",
  "[&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:text-[0.9em] dark:[&_code]:bg-white/10",
  "[&_pre]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-black/5 [&_pre]:p-2 dark:[&_pre]:bg-white/10 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-1 [&_table]:text-xs [&_th]:px-1 [&_th]:py-0.5 [&_th]:text-left [&_td]:px-1 [&_td]:py-0.5 [&_th]:border-b [&_th]:border-black/10 dark:[&_th]:border-white/10",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-black/10 [&_blockquote]:pl-2 [&_blockquote]:opacity-80 dark:[&_blockquote]:border-white/20"
);
function AssistantWidget({ title = "Assistant", placeholder = "Ask the app to do something\u2026", className }) {
  const app = useMaybeAppClient2();
  if (!app) return null;
  return /* @__PURE__ */ jsx27(AssistantWidgetInner, { title, placeholder, className });
}
function AssistantWidgetInner({ title, placeholder, className }) {
  const { available, greeting, messages, busy, send } = useAssistant();
  const [open, setOpen] = useState14(() => {
    try {
      return sessionStorage.getItem(STORAGE_OPEN) === "1";
    } catch {
      return false;
    }
  });
  const [draft, setDraft] = useState14("");
  const listRef = useRef9(null);
  const inputRef = useRef9(null);
  useEffect11(() => {
    try {
      sessionStorage.setItem(STORAGE_OPEN, open ? "1" : "0");
    } catch {
    }
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect11(() => {
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
  return /* @__PURE__ */ jsxs24("div", { className: cn("fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3", className), "data-rm-assistant": "", children: [
    open && /* @__PURE__ */ jsxs24(
      "div",
      {
        role: "dialog",
        "aria-label": title,
        className: "flex h-[min(32rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white text-left shadow-2xl dark:border-white/10 dark:bg-neutral-900",
        children: [
          /* @__PURE__ */ jsxs24("header", { className: "flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10", children: [
            /* @__PURE__ */ jsxs24("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx27("span", { className: "inline-block h-2.5 w-2.5 rounded-full bg-[color:var(--rm-accent)]", "aria-hidden": "true" }),
              /* @__PURE__ */ jsx27("span", { className: "text-sm font-semibold", children: title })
            ] }),
            /* @__PURE__ */ jsx27(
              "button",
              {
                type: "button",
                onClick: () => setOpen(false),
                className: cn("rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10", focusRing),
                "aria-label": "Close assistant",
                children: "Close"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs24("div", { ref: listRef, className: "flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm", children: [
            messages.length === 0 && /* @__PURE__ */ jsx27("p", { className: "text-neutral-500", children: greeting || "Tell me what you want done in this app and I will do it." }),
            messages.map((m) => /* @__PURE__ */ jsx27("div", { className: cn("flex", m.role === "user" ? "justify-end" : "justify-start"), children: /* @__PURE__ */ jsxs24(
              "div",
              {
                className: cn(
                  "max-w-[85%] rounded-2xl px-3 py-2",
                  m.role === "user" ? "whitespace-pre-wrap rounded-br-md bg-[color:var(--rm-accent)] text-white" : cn("rounded-bl-md bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100", assistantProse)
                ),
                children: [
                  m.role === "user" ? m.text : m.text ? /* @__PURE__ */ jsx27(Xa, { mode: "streaming", isAnimating: !!m.streaming, children: m.text }) : m.streaming ? /* @__PURE__ */ jsx27("span", { className: "animate-pulse", children: "\u2026" }) : null,
                  m.tools && m.tools.length > 0 && /* @__PURE__ */ jsxs24("div", { className: "mt-1 text-[11px] opacity-70", children: [
                    "Did: ",
                    m.tools.join(", ")
                  ] }),
                  m.error && /* @__PURE__ */ jsx27("div", { className: "mt-1 text-[12px] text-red-600 dark:text-red-400", children: m.error })
                ]
              }
            ) }, m.id))
          ] }),
          /* @__PURE__ */ jsx27("form", { onSubmit: submit, className: "border-t border-black/5 p-3 dark:border-white/10", children: /* @__PURE__ */ jsxs24("div", { className: "flex items-end gap-2", children: [
            /* @__PURE__ */ jsx27(
              "textarea",
              {
                ref: inputRef,
                value: draft,
                onChange: (e) => setDraft(e.target.value),
                onKeyDown: onKey,
                rows: 1,
                placeholder,
                className: cn(
                  "max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10",
                  focusRing
                ),
                "aria-label": "Message the assistant"
              }
            ),
            /* @__PURE__ */ jsx27(
              "button",
              {
                type: "submit",
                disabled: busy || !draft.trim(),
                className: cn(
                  "rounded-xl bg-[color:var(--rm-accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50",
                  focusRing
                ),
                children: busy ? "\u2026" : "Send"
              }
            )
          ] }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs24(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        "aria-label": open ? `Hide ${title}` : `Open ${title}`,
        className: cn(
          "flex h-12 items-center gap-2 rounded-full bg-[color:var(--rm-accent)] px-4 text-sm font-semibold text-white shadow-lg hover:brightness-95",
          focusRing
        ),
        children: [
          /* @__PURE__ */ jsx27("span", { "aria-hidden": "true", children: "\u2726" }),
          title
        ]
      }
    )
  ] });
}
export {
  AppShell,
  AssistantWidget,
  Button,
  Calendar,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chart,
  Checkbox,
  ConfirmDialog,
  ConnectionBanner,
  DEFAULT_ACCENT,
  DataTable,
  DatePicker,
  Dialog,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FileUpload,
  Form,
  Grid,
  JsonInput,
  JsonView,
  Kanban,
  KanbanCard,
  KanbanColumn,
  Markdown,
  Menu,
  MenuItem,
  NumberInput,
  Progress,
  RadioGroup,
  Row,
  Screen,
  Select,
  Skeleton,
  Spinner,
  Stack,
  StatusBadge,
  Tab,
  TabPanel,
  Tabs,
  TextArea,
  TextInput,
  Toast,
  Tooltip,
  accentStyle,
  applyTheme,
  cn,
  dismissToast,
  focusRing,
  inputBase,
  toast,
  useFormValues,
  useThemeBridge,
  useToast
};
//# sourceMappingURL=index.js.map