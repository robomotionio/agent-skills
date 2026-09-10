import {
  Xa,
  clsx
} from "./chunk-JWSPEJ2V.js";

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
var actionDoneListeners = /* @__PURE__ */ new Set();
function announceActionDone(name) {
  for (const listen of [...actionDoneListeners]) {
    try {
      listen(name);
    } catch {
    }
  }
}
function onActionDone(listen) {
  actionDoneListeners.add(listen);
  return () => {
    actionDoneListeners.delete(listen);
  };
}
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
    void runAction(action, resolveParams(params, e)).catch(() => void 0);
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

// src/components/dialog.tsx
import {
  useCallback,
  useEffect as useEffect4,
  useId as useId2,
  useRef,
  useState as useState3
} from "react";
import { createPortal } from "react-dom";
import { Fragment, jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function focusableIn(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}
var scrollLocks = 0;
function useOverlay(open, onClose) {
  const panelRef = useRef(null);
  const openerRef = useRef(null);
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
  return /* @__PURE__ */ jsxs6(OverlayPortal, { children: [
    /* @__PURE__ */ jsx6("div", { className: overlayBackdrop, onClick: isStatic ? void 0 : onClose }),
    /* @__PURE__ */ jsx6("div", { className: "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4", children: /* @__PURE__ */ jsxs6(
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
          (title !== void 0 || !hideClose) && /* @__PURE__ */ jsxs6("div", { className: "flex items-start gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800", children: [
            /* @__PURE__ */ jsxs6("div", { className: "min-w-0 flex-1", children: [
              title !== void 0 && /* @__PURE__ */ jsx6(
                "h2",
                {
                  id: `${id}-title`,
                  className: "text-base font-semibold text-neutral-900 dark:text-neutral-100",
                  children: title
                }
              ),
              description !== void 0 && /* @__PURE__ */ jsx6("p", { id: `${id}-desc`, className: "mt-1 text-sm text-neutral-500 dark:text-neutral-400", children: description })
            ] }),
            !hideClose && /* @__PURE__ */ jsx6(CloseButton, { onClick: onClose })
          ] }),
          children !== void 0 && /* @__PURE__ */ jsx6("div", { className: "px-5 py-4 text-sm text-neutral-800 dark:text-neutral-200", children }),
          footer !== void 0 && /* @__PURE__ */ jsx6("div", { className: "flex items-center justify-end gap-2 rounded-b-lg border-t border-neutral-200 bg-neutral-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900/60", children: footer })
        ]
      }
    ) })
  ] });
}
function CloseButton({ onClick, label = "Close" }) {
  return /* @__PURE__ */ jsx6(
    "button",
    {
      type: "button",
      "aria-label": label,
      onClick,
      className: cn(
        "-mr-1 shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        focusRing
      ),
      children: /* @__PURE__ */ jsx6("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx6("path", { strokeLinecap: "round", d: "M6 6l12 12M18 6L6 18" }) })
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
  return /* @__PURE__ */ jsx6(
    Dialog,
    {
      open,
      onClose: busy ? () => void 0 : onClose,
      static: busy,
      hideClose: busy,
      size: "sm",
      title,
      description,
      footer: /* @__PURE__ */ jsxs6(Fragment, { children: [
        /* @__PURE__ */ jsx6(Button, { variant: "secondary", onClick: onClose, disabled: busy, children: cancelLabel }),
        /* @__PURE__ */ jsx6(
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

// src/components/alert.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var VARIANTS = {
  info: {
    box: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
    icon: "text-blue-500 dark:text-blue-400",
    label: "Information"
  },
  success: {
    box: "border-green-200 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200",
    icon: "text-green-500 dark:text-green-400",
    label: "Success"
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    icon: "text-amber-500 dark:text-amber-400",
    label: "Warning"
  },
  error: {
    box: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
    icon: "text-red-500 dark:text-red-400",
    label: "Error"
  }
};
var ICON_PATHS = {
  info: "M12 9h.01M11 12h1v4h1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  success: "m9 12 2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  warning: "M12 9v4m0 3h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  error: "M12 9v4m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
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
  const v = VARIANTS[variant];
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      role: variant === "error" || variant === "warning" ? "alert" : "status",
      className: cn("flex items-start gap-3 rounded-lg border p-3 text-left text-sm", v.box, className),
      ...props,
      children: [
        /* @__PURE__ */ jsx7(
          "svg",
          {
            "aria-hidden": "true",
            className: cn("mt-0.5 h-4 w-4 shrink-0", v.icon),
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            children: /* @__PURE__ */ jsx7("path", { strokeLinecap: "round", strokeLinejoin: "round", d: ICON_PATHS[variant] })
          }
        ),
        /* @__PURE__ */ jsxs7("div", { className: "min-w-0 flex-1", children: [
          title !== void 0 && /* @__PURE__ */ jsx7("div", { className: "font-medium", children: title }),
          children !== void 0 && /* @__PURE__ */ jsx7("div", { className: cn(title !== void 0 && "mt-0.5", "opacity-90"), children }),
          action !== void 0 && /* @__PURE__ */ jsx7("div", { className: "mt-2", children: action })
        ] }),
        onDismiss && /* @__PURE__ */ jsx7(CloseButton, { onClick: onDismiss, label: `Dismiss this ${v.label.toLowerCase()}` })
      ]
    }
  );
}

// src/components/copy-button.tsx
import { useState as useState4 } from "react";
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function CopyButton({
  value,
  children,
  label = "Copy",
  toastTitle = "Copied",
  size = "sm",
  disabled,
  className
}) {
  const [copied, setCopied] = useState4(false);
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
  return /* @__PURE__ */ jsxs8(
    "button",
    {
      type: "button",
      "aria-label": children === void 0 ? label : void 0,
      disabled,
      onClick: () => void copy(),
      className: cn(
        "inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
        focusRing,
        className
      ),
      children: [
        copied ? /* @__PURE__ */ jsx8(TickIcon, {}) : /* @__PURE__ */ jsx8(CopyIcon, {}),
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
function CopyIcon() {
  return /* @__PURE__ */ jsx8("svg", { "aria-hidden": "true", className: "h-3.5 w-3.5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx8(
    "path",
    {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M8 8V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3M5 8h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
    }
  ) });
}
function TickIcon() {
  return /* @__PURE__ */ jsx8(
    "svg",
    {
      "aria-hidden": "true",
      className: "h-3.5 w-3.5 text-green-600 dark:text-green-400",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      children: /* @__PURE__ */ jsx8("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m5 13 4 4L19 7" })
    }
  );
}

// src/components/menu.tsx
import {
  Children,
  createContext,
  forwardRef as forwardRef2,
  useContext,
  useEffect as useEffect5,
  useRef as useRef2,
  useState as useState5
} from "react";
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
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
  const [open, setOpen] = useState5(false);
  const buttonRef = useRef2(null);
  const rootRef = useRef2(null);
  const panelRef = useRef2(null);
  useEffect5(() => {
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
  return /* @__PURE__ */ jsxs9("div", { ref: rootRef, className: cn("relative inline-block", className), children: [
    /* @__PURE__ */ jsx9(
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
        children: trigger ?? /* @__PURE__ */ jsx9(MoreIcon, {})
      }
    ),
    open && /* @__PURE__ */ jsx9(MenuContext.Provider, { value: { close }, children: /* @__PURE__ */ jsx9(
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
        children: items2 ? items2.map((item, i) => /* @__PURE__ */ jsx9(
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
  return /* @__PURE__ */ jsx9(
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
  return /* @__PURE__ */ jsxs9("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "currentColor", children: [
    /* @__PURE__ */ jsx9("circle", { cx: "12", cy: "5", r: "1.75" }),
    /* @__PURE__ */ jsx9("circle", { cx: "12", cy: "12", r: "1.75" }),
    /* @__PURE__ */ jsx9("circle", { cx: "12", cy: "19", r: "1.75" })
  ] });
}

// src/components/card.tsx
import { jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx10(
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
  return /* @__PURE__ */ jsxs10(
    "div",
    {
      className: cn(
        "border-b border-neutral-200 px-4 py-3 dark:border-neutral-800",
        className
      ),
      ...props,
      children: [
        title !== void 0 && /* @__PURE__ */ jsx10("h3", { className: "text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: title }),
        description !== void 0 && /* @__PURE__ */ jsx10("p", { className: "mt-0.5 text-sm text-neutral-500 dark:text-neutral-400", children: description }),
        children
      ]
    }
  );
}
function CardBody({ className, ...props }) {
  return /* @__PURE__ */ jsx10("div", { className: cn("px-4 py-4", className), ...props });
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx10(
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

// src/components/drawer.tsx
import { useId as useId3 } from "react";
import { jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs11(OverlayPortal, { children: [
    /* @__PURE__ */ jsx11("div", { className: overlayBackdrop, onClick: onClose }),
    /* @__PURE__ */ jsx11(
      "div",
      {
        className: cn(
          "fixed inset-y-0 z-50 flex w-full p-0",
          side === "right" ? "right-0 justify-end" : "left-0 justify-start",
          WIDTHS[size]
        ),
        children: /* @__PURE__ */ jsxs11(
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
              (title !== void 0 || !hideClose) && /* @__PURE__ */ jsxs11("div", { className: "flex items-start gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800", children: [
                /* @__PURE__ */ jsxs11("div", { className: "min-w-0 flex-1", children: [
                  title !== void 0 && /* @__PURE__ */ jsx11(
                    "h2",
                    {
                      id: `${id}-title`,
                      className: "text-base font-semibold text-neutral-900 dark:text-neutral-100",
                      children: title
                    }
                  ),
                  description !== void 0 && /* @__PURE__ */ jsx11("p", { id: `${id}-desc`, className: "mt-1 text-sm text-neutral-500 dark:text-neutral-400", children: description })
                ] }),
                !hideClose && /* @__PURE__ */ jsx11(CloseButton, { onClick: onClose })
              ] }),
              /* @__PURE__ */ jsx11("div", { className: "flex-1 overflow-y-auto px-5 py-4 text-sm text-neutral-800 dark:text-neutral-200", children }),
              footer !== void 0 && /* @__PURE__ */ jsx11("div", { className: "flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900/60", children: footer })
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
  useState as useState6
} from "react";
import { jsx as jsx12, jsxs as jsxs12 } from "react/jsx-runtime";
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
  const [ownValue, setOwnValue] = useState6(defaultValue2 ?? firstValue);
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
  return /* @__PURE__ */ jsx12(TabsContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs12("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx12(
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
  return /* @__PURE__ */ jsxs12(
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
        badge !== void 0 && /* @__PURE__ */ jsx12("span", { className: "rounded-full bg-neutral-100 px-1.5 text-xs font-normal text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300", children: badge })
      ]
    }
  );
}
function TabPanel({ value, className, children }) {
  const ctx = useContext2(TabsContext);
  const active = ctx?.value === value;
  if (!active) return null;
  return /* @__PURE__ */ jsx12(
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
import { useCallback as useCallback2, useEffect as useEffect6, useId as useId5, useRef as useRef4, useState as useState7 } from "react";
import { Fragment as Fragment2, jsx as jsx13, jsxs as jsxs13 } from "react/jsx-runtime";
var GAP = 8;
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
  const [ownOpen, setOwnOpen] = useState7(false);
  const open = controlledOpen ?? ownOpen;
  const id = useId5();
  const triggerRef = useRef4(null);
  const [box, setBox] = useState7(null);
  const setOpen = useCallback2(
    (next) => {
      if (controlledOpen === void 0) setOwnOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange]
  );
  const close = useCallback2(() => setOpen(false), [setOpen]);
  const { panelRef, onKeyDown } = useOverlay(open, close);
  useEffect6(() => {
    if (!open) return;
    const place = () => {
      const t = triggerRef.current?.getBoundingClientRect();
      const p = panelRef.current?.getBoundingClientRect();
      if (!t) return;
      const w = p?.width ?? width;
      const h = p?.height ?? 0;
      let top = t.bottom + GAP;
      let left = t.left;
      if (side === "top") top = t.top - h - GAP;
      else if (side === "left") {
        top = t.top;
        left = t.left - w - GAP;
      } else if (side === "right") {
        top = t.top;
        left = t.right + GAP;
      }
      if (side === "top" || side === "bottom") {
        if (align === "center") left = t.left + t.width / 2 - w / 2;
        else if (align === "end") left = t.right - w;
      } else if (align === "center") top = t.top + t.height / 2 - h / 2;
      else if (align === "end") top = t.bottom - h;
      const maxLeft = (typeof window === "undefined" ? w : window.innerWidth) - w - 8;
      const maxTop = (typeof window === "undefined" ? h : window.innerHeight) - h - 8;
      setBox({ top: Math.max(8, Math.min(top, Math.max(8, maxTop))), left: Math.max(8, Math.min(left, Math.max(8, maxLeft))) });
    };
    place();
    const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame(place) : null;
    window.addEventListener("resize", place);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
    };
  }, [open, side, align, width, panelRef]);
  useEffect6(() => {
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
  return /* @__PURE__ */ jsxs13(Fragment2, { children: [
    /* @__PURE__ */ jsx13(
      "button",
      {
        ref: triggerRef,
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": open ? `${id}-panel` : void 0,
        onClick: () => setOpen(!open),
        className: cn(
          "inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
          focusRing,
          triggerClassName
        ),
        children: trigger
      }
    ),
    open && /* @__PURE__ */ jsx13(OverlayPortal, { children: /* @__PURE__ */ jsxs13(
      "div",
      {
        ref: panelRef,
        id: `${id}-panel`,
        role: "dialog",
        "aria-label": label ?? (typeof title === "string" ? title : "Options"),
        tabIndex: -1,
        onKeyDown,
        style: { top: box?.top ?? -9999, left: box?.left ?? -9999, width },
        className: cn(
          "fixed z-50 max-w-[calc(100vw-1rem)] rounded-lg border border-neutral-200 bg-white p-3 text-left text-sm shadow-lg outline-none dark:border-neutral-700 dark:bg-neutral-900",
          className
        ),
        children: [
          title !== void 0 && /* @__PURE__ */ jsx13("div", { className: "mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: title }),
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
  isValidElement as isValidElement2,
  useId as useId6,
  useState as useState8
} from "react";
import { jsx as jsx14, jsxs as jsxs14 } from "react/jsx-runtime";
var SIDES = {
  top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-1.5 -translate-x-1/2",
  left: "right-full top-1/2 mr-1.5 -translate-y-1/2",
  right: "left-full top-1/2 ml-1.5 -translate-y-1/2"
};
function Tooltip({ content, side = "top", className, children }) {
  const [open, setOpen] = useState8(false);
  const id = useId6();
  const child = Children3.only(children);
  const described = isValidElement2(child) ? cloneElement(child, {
    "aria-describedby": open ? id : void 0
  }) : child;
  return /* @__PURE__ */ jsxs14(
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
        /* @__PURE__ */ jsx14(
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

// src/components/skeleton.tsx
import { jsx as jsx15 } from "react/jsx-runtime";
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
    return /* @__PURE__ */ jsx15("div", { className: cn("flex flex-col gap-2", className), "aria-hidden": "true", style, ...props, children: Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsx15(
      "div",
      {
        className: cn(base, "h-4 rounded"),
        style: { width: i === lines - 1 ? "60%" : width ?? "100%" }
      },
      i
    )) });
  }
  return /* @__PURE__ */ jsx15(
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

// src/components/chart.tsx
import { useId as useId7, useMemo, useState as useState9 } from "react";

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
import { Fragment as Fragment3, jsx as jsx16, jsxs as jsxs15 } from "react/jsx-runtime";
var WIDTH = 480;
function seriesOpacity(i, n, floor = 0.3) {
  if (n <= 1) return 1;
  const step = (1 - floor) / Math.max(1, n - 1);
  return Number((1 - i * step).toFixed(3));
}
function sparklinePath(values, width, height) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return "";
  const max = Math.max(...clean);
  const min = Math.min(...clean);
  const span = max - min || 1;
  const x = (i) => clean.length === 1 ? width / 2 : i * width / (clean.length - 1);
  const y = (v) => height - (v - min) / span * height;
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
  const id = useId7();
  const fmt = formatValue ?? ((v) => v.toLocaleString());
  const linkAttrs = source ? sourceLinkAttrs(source) : {};
  const plot = useMemo(
    () => buildPlot(data, series, xKind, title ?? "Value"),
    [data, series, xKind, title]
  );
  const [hover, setHover] = useState9(null);
  const n = plot.series.length;
  const showLegend = legend ?? (kind === "pie" || n > 1);
  const fmtX = useMemo(() => {
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
    return /* @__PURE__ */ jsx16(
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
  const desc = description ?? describe(kind, plot, fmt, fmtX);
  const geo = geometry(plot, kind, stacked, height, n > 1);
  return /* @__PURE__ */ jsx16("div", { className: cn("text-left", className), ...linkAttrs, children: /* @__PURE__ */ jsxs15("div", { className: kind === "pie" ? "flex flex-wrap items-center gap-6" : "relative", children: [
    /* @__PURE__ */ jsxs15(
      "svg",
      {
        role: "img",
        "aria-labelledby": `${id}-t ${id}-d`,
        viewBox: `0 0 ${WIDTH} ${height}`,
        className: cn("h-auto", kind === "pie" ? "w-48 max-w-full" : "w-full"),
        onMouseLeave: () => setHover(null),
        children: [
          /* @__PURE__ */ jsx16("title", { id: `${id}-t`, children: title ?? "Chart" }),
          /* @__PURE__ */ jsx16("desc", { id: `${id}-d`, children: desc }),
          kind === "pie" ? /* @__PURE__ */ jsx16(Pie, { plot, height }) : /* @__PURE__ */ jsxs15(Fragment3, { children: [
            /* @__PURE__ */ jsx16(Axes, { geo, plot, height, fmt, fmtX }),
            kind === "bar" ? /* @__PURE__ */ jsx16(Bars, { plot, geo, height, fmt, stacked }) : /* @__PURE__ */ jsx16(Lines, { plot, geo, kind, fmt }),
            /* @__PURE__ */ jsx16(HoverBands, { geo, height, count: plot.categories.length, onHover: setHover })
          ] })
        ]
      }
    ),
    kind !== "pie" && hover !== null && /* @__PURE__ */ jsx16(Tooltip2, { plot, at: hover, geo, fmt, fmtX }),
    showLegend && /* @__PURE__ */ jsx16(Legend, { plot, kind, fmt, className: kind === "pie" ? "min-w-0 flex-1" : "mt-2" })
  ] }) });
}
var PAD = { top: 14, right: 8, bottom: 26 };
var PAD_LEFT_BARE = 8;
var PAD_LEFT_AXIS = 38;
function geometry(plot, kind, stacked, height, showAxis) {
  const padLeft = showAxis ? PAD_LEFT_AXIS : PAD_LEFT_BARE;
  const plotW = WIDTH - padLeft - PAD.right;
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
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const y = (v) => PAD.top + plotH - (v - min) / span * plotH;
  const slot = count > 0 ? plotW / count : plotW;
  const slotX = (i) => padLeft + (i + 0.5) * slot;
  const times = plot.times;
  const tMin = times ? Math.min(...times) : 0;
  const tSpan = times ? Math.max(...times) - tMin || 1 : 1;
  const pointX = times && count > 1 ? (i) => padLeft + (times[i] - tMin) / tSpan * plotW : (i) => count === 1 ? padLeft + plotW / 2 : padLeft + i * plotW / (count - 1);
  const ticks = showAxis ? [min, min + span / 2, max] : [];
  return { padLeft, plotW, plotH, min, max, y, slotX, pointX, slot, ticks, showAxis };
}
var axisLine = "stroke-neutral-200 dark:stroke-neutral-800";
var axisText = "fill-neutral-500 dark:fill-neutral-400";
function Axes({
  geo,
  plot,
  height,
  fmt,
  fmtX
}) {
  const count = plot.categories.length;
  const every = Math.max(1, Math.ceil(count / 6));
  return /* @__PURE__ */ jsxs15(Fragment3, { children: [
    geo.ticks.map((t, i) => /* @__PURE__ */ jsxs15("g", { children: [
      /* @__PURE__ */ jsx16(
        "line",
        {
          x1: geo.padLeft,
          y1: geo.y(t),
          x2: WIDTH - PAD.right,
          y2: geo.y(t),
          className: axisLine,
          strokeWidth: 1
        }
      ),
      /* @__PURE__ */ jsx16("text", { x: geo.padLeft - 6, y: geo.y(t) + 3, textAnchor: "end", fontSize: 9, className: axisText, children: fmt(t) })
    ] }, `tick-${i}`)),
    !geo.showAxis && /* @__PURE__ */ jsx16(
      "line",
      {
        x1: geo.padLeft,
        y1: geo.y(Math.max(0, geo.min)),
        x2: WIDTH - PAD.right,
        y2: geo.y(Math.max(0, geo.min)),
        className: axisLine,
        strokeWidth: 1
      }
    ),
    plot.categories.map(
      (c, i) => i % every === 0 ? /* @__PURE__ */ jsx16(
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
  height,
  fmt,
  stacked
}) {
  const n = plot.series.length;
  const base2 = geo.y(Math.max(0, geo.min));
  const groupW = Math.max(4, Math.min(48 * (stacked || n === 1 ? 1 : n), geo.slot * 0.7));
  const barW = stacked || n === 1 ? groupW : groupW / n;
  return /* @__PURE__ */ jsxs15(Fragment3, { children: [
    plot.categories.map((c, i) => {
      const cx2 = geo.slotX(i);
      let stackTop = base2;
      return /* @__PURE__ */ jsxs15("g", { children: [
        plot.series.map((s, si) => {
          const v = plot.grid[si][i];
          if (v === void 0) return null;
          const top = geo.y(v);
          if (stacked) {
            const h = Math.abs(base2 - top);
            const yTop = stackTop - h;
            stackTop = yTop;
            return /* @__PURE__ */ jsx16(
              "rect",
              {
                x: cx2 - groupW / 2,
                y: yTop,
                width: groupW,
                height: Math.max(h, v === 0 ? 0 : 1),
                rx: 2,
                fill: s.color ?? "var(--rm-accent)",
                fillOpacity: s.color ? 1 : seriesOpacity(si, n)
              },
              si
            );
          }
          const x = n === 1 ? cx2 - barW / 2 : cx2 - groupW / 2 + si * barW;
          return /* @__PURE__ */ jsx16(
            "rect",
            {
              x,
              y: Math.min(top, base2),
              width: Math.max(2, barW - (n > 1 ? 1 : 0)),
              height: Math.max(Math.abs(base2 - top), v === 0 ? 0 : 1),
              rx: 2,
              fill: s.color ?? "var(--rm-accent)",
              fillOpacity: s.color ? 1 : n === 1 ? seriesOpacity(i, plot.categories.length) : seriesOpacity(si, n)
            },
            si
          );
        }),
        n === 1 && plot.grid[0][i] !== void 0 && /* @__PURE__ */ jsx16(
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
    /* @__PURE__ */ jsx16("line", { x1: geo.padLeft, y1: base2, x2: WIDTH - PAD.right, y2: base2, className: axisLine, strokeWidth: 1 })
  ] });
}
function Lines({
  plot,
  geo,
  kind,
  fmt
}) {
  const n = plot.series.length;
  return /* @__PURE__ */ jsx16(Fragment3, { children: plot.series.map((s, si) => {
    const pts = [];
    plot.grid[si].forEach((v, i) => {
      if (v !== void 0) pts.push({ x: geo.pointX(i), y: geo.y(v), v });
    });
    if (pts.length === 0) return null;
    const stroke = s.color ?? "var(--rm-accent)";
    const opacity = s.color ? 1 : seriesOpacity(si, n, 0.45);
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
    const floor = geo.y(geo.min);
    return /* @__PURE__ */ jsxs15("g", { children: [
      kind === "area" && /* @__PURE__ */ jsx16(
        "path",
        {
          d: `${line} L ${pts[pts.length - 1].x},${floor} L ${pts[0].x},${floor} Z`,
          fill: stroke,
          fillOpacity: 0.12 * opacity + 0.04
        }
      ),
      /* @__PURE__ */ jsx16(
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
      pts.map((p, i) => /* @__PURE__ */ jsx16("circle", { cx: p.x, cy: p.y, r: 2.5, fill: stroke, fillOpacity: opacity }, i)),
      n === 1 && pts.map(
        (p, i) => i % Math.max(1, Math.ceil(pts.length / 6)) === 0 ? /* @__PURE__ */ jsx16("text", { x: p.x, y: p.y - 7, textAnchor: "middle", fontSize: 10, className: axisText, children: fmt(p.v) }, `v-${i}`) : null
      )
    ] }, si);
  }) });
}
function Pie({ plot, height }) {
  const row = plot.grid[0] ?? [];
  const values = plot.categories.map((_, i) => Math.max(0, row[i] ?? 0));
  const total = values.reduce((a, b) => a + b, 0);
  const r = Math.max(10, Math.min(WIDTH, height) / 2 - 8);
  const cx2 = WIDTH / 2;
  const cy = height / 2;
  if (total <= 0) {
    return /* @__PURE__ */ jsx16("circle", { cx: cx2, cy, r, fill: "var(--rm-accent)", fillOpacity: 0.15 });
  }
  let angle = -Math.PI / 2;
  return /* @__PURE__ */ jsx16(Fragment3, { children: values.map((v, i) => {
    const share = v / total;
    const start = angle;
    angle += share * Math.PI * 2;
    if (share >= 0.9999) {
      return /* @__PURE__ */ jsx16("circle", { cx: cx2, cy, r, fill: "var(--rm-accent)", fillOpacity: 1 }, i);
    }
    if (share <= 0) return null;
    const x1 = cx2 + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx2 + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = share * Math.PI * 2 > Math.PI ? 1 : 0;
    return /* @__PURE__ */ jsx16(
      "path",
      {
        d: `M ${cx2},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} Z`,
        fill: "var(--rm-accent)",
        fillOpacity: seriesOpacity(i, values.length)
      },
      i
    );
  }) });
}
function HoverBands({
  geo,
  height,
  count,
  onHover
}) {
  return /* @__PURE__ */ jsx16(Fragment3, { children: Array.from({ length: count }, (_, i) => /* @__PURE__ */ jsx16(
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
function Tooltip2({
  plot,
  at,
  geo,
  fmt,
  fmtX
}) {
  const rows = plot.series.map((s, si) => ({ name: s.name, color: s.color, i: si, v: plot.grid[si][at] })).filter((r) => r.v !== void 0);
  if (rows.length === 0) return null;
  const left = geo.slotX(at) / WIDTH * 100;
  return /* @__PURE__ */ jsxs15(
    "div",
    {
      role: "presentation",
      style: { left: `${left}%` },
      className: "pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs shadow-lg dark:border-neutral-700 dark:bg-neutral-900",
      children: [
        /* @__PURE__ */ jsx16("div", { className: "font-medium text-neutral-900 dark:text-neutral-100", children: fmtX(plot.categories[at]) }),
        rows.map((r) => /* @__PURE__ */ jsxs15("div", { className: "mt-0.5 flex items-center gap-1.5 whitespace-nowrap", children: [
          /* @__PURE__ */ jsx16(
            "span",
            {
              "aria-hidden": "true",
              className: "h-2 w-2 shrink-0 rounded-sm bg-[color:var(--rm-accent)]",
              style: r.color ? { background: r.color } : { opacity: seriesOpacity(r.i, plot.series.length, 0.45) }
            }
          ),
          /* @__PURE__ */ jsx16("span", { className: "text-neutral-600 dark:text-neutral-400", children: r.name }),
          /* @__PURE__ */ jsx16("span", { className: "ml-auto tabular-nums text-neutral-900 dark:text-neutral-100", children: fmt(r.v) })
        ] }, r.i))
      ]
    }
  );
}
function Legend({
  plot,
  kind,
  fmt,
  className
}) {
  const entries = kind === "pie" ? plot.categories.map((c, i) => ({
    key: `${String(c)}-${i}`,
    label: String(c),
    value: plot.grid[0]?.[i],
    opacity: seriesOpacity(i, plot.categories.length),
    color: void 0
  })) : plot.series.map((s, i) => ({
    key: `${s.name}-${i}`,
    label: s.name,
    value: void 0,
    opacity: seriesOpacity(i, plot.series.length, 0.45),
    color: s.color
  }));
  return /* @__PURE__ */ jsx16("ul", { className: cn("space-y-1 text-sm", className), children: entries.map((e) => /* @__PURE__ */ jsxs15("li", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx16(
      "span",
      {
        "aria-hidden": "true",
        className: "h-3 w-3 shrink-0 rounded-sm bg-[color:var(--rm-accent)]",
        style: e.color ? { background: e.color } : { opacity: e.opacity }
      }
    ),
    /* @__PURE__ */ jsx16("span", { className: "min-w-0 flex-1 truncate text-neutral-700 dark:text-neutral-300", children: e.label }),
    e.value !== void 0 && /* @__PURE__ */ jsx16("span", { className: "tabular-nums text-neutral-500 dark:text-neutral-400", children: fmt(e.value) })
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
function clip(text, max) {
  if (max <= 1 || text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1))}\u2026`;
}

// src/components/stat.tsx
import { jsx as jsx17, jsxs as jsxs16 } from "react/jsx-runtime";
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
  className
}) {
  const good = delta !== void 0 && delta !== 0 && delta > 0 === upIsGood;
  const flat = delta === void 0 || delta === 0;
  const deltaClass = flat ? "text-neutral-500 dark:text-neutral-400" : good ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  const body = /* @__PURE__ */ jsxs16("div", { className: cn("min-w-0 text-left", card ? "px-4 py-3.5" : void 0, !card && className), children: [
    /* @__PURE__ */ jsxs16("div", { className: "flex items-start gap-2", children: [
      /* @__PURE__ */ jsxs16("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx17("div", { className: "truncate text-sm text-neutral-500 dark:text-neutral-400", children: label }),
        loading ? /* @__PURE__ */ jsx17(Skeleton, { variant: "text", lines: 1, width: "60%", className: "mt-2" }) : /* @__PURE__ */ jsxs16("div", { className: "mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100", children: [
          value,
          unit !== void 0 && /* @__PURE__ */ jsx17("span", { className: "ml-1 text-base font-normal text-neutral-500 dark:text-neutral-400", children: unit })
        ] })
      ] }),
      icon !== void 0 && /* @__PURE__ */ jsx17("div", { "aria-hidden": "true", className: "shrink-0 text-neutral-300 dark:text-neutral-600", children: icon })
    ] }),
    delta !== void 0 && !loading && /* @__PURE__ */ jsxs16("div", { className: "mt-1 flex items-center gap-1 text-sm", children: [
      /* @__PURE__ */ jsx17(ArrowIcon, { delta, className: deltaClass }),
      /* @__PURE__ */ jsxs16("span", { className: cn("font-medium tabular-nums", deltaClass), children: [
        delta > 0 ? "+" : "",
        wholeNumber.format(delta),
        "%"
      ] }),
      /* @__PURE__ */ jsx17("span", { className: "truncate text-neutral-500 dark:text-neutral-400", children: deltaLabel })
    ] }),
    trend && trend.length > 1 && !loading && /* @__PURE__ */ jsx17(
      "svg",
      {
        "aria-hidden": "true",
        viewBox: "0 0 120 28",
        preserveAspectRatio: "none",
        className: "mt-2 h-7 w-full",
        children: /* @__PURE__ */ jsx17(
          "path",
          {
            d: sparklinePath(trend, 120, 26),
            fill: "none",
            stroke: "var(--rm-accent)",
            strokeWidth: 1.5,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            vectorEffect: "non-scaling-stroke"
          }
        )
      }
    )
  ] });
  return card ? /* @__PURE__ */ jsx17(Card, { className, children: body }) : body;
}
function ArrowIcon({ delta, className }) {
  if (delta === 0) {
    return /* @__PURE__ */ jsx17("svg", { "aria-hidden": "true", className: cn("h-3.5 w-3.5", className), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx17("path", { strokeLinecap: "round", d: "M5 12h14" }) });
  }
  return /* @__PURE__ */ jsx17("svg", { "aria-hidden": "true", className: cn("h-3.5 w-3.5", className), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx17(
    "path",
    {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: delta > 0 ? "M12 19V5m0 0-6 6m6-6 6 6" : "M12 5v14m0 0 6-6m-6 6-6-6"
    }
  ) });
}

// src/components/stepper.tsx
import {
  Children as Children4,
  isValidElement as isValidElement3,
  useState as useState10
} from "react";
import { jsx as jsx18, jsxs as jsxs17 } from "react/jsx-runtime";
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
  const steps = items2.filter((c) => isValidElement3(c) && c.type === Step);
  const rest = items2.filter((c) => !(isValidElement3(c) && c.type === Step));
  const [ownValue, setOwnValue] = useState10(defaultValue2);
  const current = Math.max(0, Math.min(value ?? ownValue, Math.max(0, steps.length - 1)));
  const [furthest, setFurthest] = useState10(current);
  if (current > furthest) setFurthest(current);
  const go = (next) => {
    const clamped = Math.max(0, Math.min(next, steps.length - 1));
    if (value === void 0) setOwnValue(clamped);
    if (clamped > furthest) setFurthest(clamped);
    onChange?.(clamped);
  };
  const last = current >= steps.length - 1;
  return /* @__PURE__ */ jsxs17("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx18("ol", { "aria-label": label, className: "flex flex-wrap items-center gap-x-2 gap-y-2", children: steps.map((child, i) => {
      const props = isValidElement3(child) ? child.props : { title: "" };
      const state = i < current ? "done" : i === current ? "current" : "todo";
      const reachable = nonLinear || i <= furthest;
      return /* @__PURE__ */ jsxs17("li", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs17(
          "button",
          {
            type: "button",
            "aria-current": state === "current" ? "step" : void 0,
            disabled: !reachable || props.disabled,
            onClick: () => go(i),
            className: cn(
              "flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors disabled:cursor-not-allowed",
              focusRing
            ),
            children: [
              /* @__PURE__ */ jsx18(
                "span",
                {
                  "aria-hidden": "true",
                  className: cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    state === "todo" ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" : "bg-[color:var(--rm-accent)] text-white"
                  ),
                  children: state === "done" ? /* @__PURE__ */ jsx18(TickIcon2, {}) : i + 1
                }
              ),
              /* @__PURE__ */ jsxs17("span", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxs17(
                  "span",
                  {
                    className: cn(
                      "block text-sm font-medium",
                      state === "current" ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"
                    ),
                    children: [
                      props.title,
                      props.optional && /* @__PURE__ */ jsx18("span", { className: "ml-1 text-xs font-normal text-neutral-400", children: "(optional)" })
                    ]
                  }
                ),
                props.description !== void 0 && /* @__PURE__ */ jsx18("span", { className: "block text-xs text-neutral-500 dark:text-neutral-400", children: props.description })
              ] })
            ]
          }
        ),
        i < steps.length - 1 && /* @__PURE__ */ jsx18(
          "span",
          {
            "aria-hidden": "true",
            className: "hidden h-px w-8 bg-neutral-200 dark:bg-neutral-700 sm:block"
          }
        )
      ] }, i);
    }) }),
    /* @__PURE__ */ jsx18("div", { className: "mt-4", children: steps[current] }),
    controls && steps.length > 1 && /* @__PURE__ */ jsxs17("div", { className: "mt-5 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx18(Button, { variant: "secondary", disabled: current === 0, onClick: () => go(current - 1), children: backLabel }),
      !last && /* @__PURE__ */ jsx18(Button, { disabled: nextDisabled, onClick: () => go(current + 1), children: nextLabel })
    ] }),
    rest
  ] });
}
function Step({ className, children }) {
  return /* @__PURE__ */ jsx18("div", { className: cn("text-left", className), children });
}
function TickIcon2() {
  return /* @__PURE__ */ jsx18("svg", { className: "h-3.5 w-3.5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", children: /* @__PURE__ */ jsx18("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m5 13 4 4L19 7" }) });
}

// src/components/accordion.tsx
import {
  createContext as createContext3,
  useContext as useContext3,
  useId as useId8,
  useRef as useRef5,
  useState as useState11
} from "react";
import { jsx as jsx19, jsxs as jsxs18 } from "react/jsx-runtime";
var AccordionContext = createContext3(null);
function Accordion({
  type = "multiple",
  value,
  defaultValue: defaultValue2,
  onChange,
  className,
  children
}) {
  const baseId = useId8();
  const [ownValue, setOwnValue] = useState11(defaultValue2 ?? []);
  const open = value ?? ownValue;
  const rootRef = useRef5(null);
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
  return /* @__PURE__ */ jsx19(AccordionContext.Provider, { value: ctx, children: /* @__PURE__ */ jsx19(
    "div",
    {
      ref: rootRef,
      onKeyDown,
      className: cn(
        "divide-y divide-neutral-200 rounded-lg border border-neutral-200 text-left dark:divide-neutral-800 dark:border-neutral-800",
        className
      ),
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
  const ctx = useContext3(AccordionContext);
  const open = ctx?.isOpen(value) ?? false;
  const headerId = `${ctx?.baseId ?? "acc"}-h-${value}`;
  const panelId = `${ctx?.baseId ?? "acc"}-p-${value}`;
  return /* @__PURE__ */ jsxs18("div", { className, children: [
    /* @__PURE__ */ jsx19("h3", { className: "m-0", children: /* @__PURE__ */ jsxs18(
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
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800/60",
          focusRing
        ),
        children: [
          /* @__PURE__ */ jsx19(ChevronIcon, { open }),
          /* @__PURE__ */ jsxs18("span", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx19("span", { className: "block text-sm font-medium text-neutral-900 dark:text-neutral-100", children: title }),
            description !== void 0 && /* @__PURE__ */ jsx19("span", { className: "mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400", children: description })
          ] }),
          meta !== void 0 && /* @__PURE__ */ jsx19("span", { className: "shrink-0 text-xs", children: meta })
        ]
      }
    ) }),
    open && /* @__PURE__ */ jsx19(
      "div",
      {
        id: panelId,
        role: "region",
        "aria-labelledby": headerId,
        className: "px-4 pb-4 pt-1 text-sm text-neutral-700 dark:text-neutral-300",
        children
      }
    )
  ] });
}
function ChevronIcon({ open }) {
  return /* @__PURE__ */ jsx19(
    "svg",
    {
      "aria-hidden": "true",
      className: cn(
        "h-4 w-4 shrink-0 text-neutral-400 transition-transform dark:text-neutral-500",
        open && "rotate-90"
      ),
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      children: /* @__PURE__ */ jsx19("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m9 6 6 6-6 6" })
    }
  );
}

// src/components/timeline.tsx
import { Children as Children5 } from "react";

// src/components/status-badge.tsx
import { jsx as jsx20, jsxs as jsxs19 } from "react/jsx-runtime";
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
function statusDotClass(status) {
  return STYLES[status].dot;
}
function StatusBadge({ status, children, className, ...props }) {
  const s = STYLES[status];
  return /* @__PURE__ */ jsxs19(
    "span",
    {
      className: cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.pill,
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx20("span", { "aria-hidden": "true", className: cn("h-1.5 w-1.5 rounded-full", s.dot) }),
        children ?? s.label
      ]
    }
  );
}

// src/components/timeline.tsx
import { jsx as jsx21, jsxs as jsxs20 } from "react/jsx-runtime";
function Timeline({ children, className, ...props }) {
  const items2 = Children5.toArray(children);
  return /* @__PURE__ */ jsx21("ol", { className: cn("relative text-left", className), ...props, children: items2.map((child, i) => /* @__PURE__ */ jsxs20("li", { className: "relative pb-5 pl-6 last:pb-0", children: [
    i < items2.length - 1 && /* @__PURE__ */ jsx21(
      "span",
      {
        "aria-hidden": "true",
        className: "absolute left-[5px] top-3 h-full w-px bg-neutral-200 dark:bg-neutral-700"
      }
    ),
    child
  ] }, i)) });
}
function TimelineItem({ at, title, body, status = "pending", by, className, children }) {
  return /* @__PURE__ */ jsxs20("div", { className: cn("min-w-0", className), children: [
    /* @__PURE__ */ jsx21(
      "span",
      {
        "aria-hidden": "true",
        className: cn(
          "absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-neutral-900",
          statusDotClass(status)
        )
      }
    ),
    /* @__PURE__ */ jsxs20("div", { className: "flex flex-wrap items-baseline gap-x-2 gap-y-0.5", children: [
      /* @__PURE__ */ jsx21("span", { className: "text-sm font-medium text-neutral-900 dark:text-neutral-100", children: title }),
      at !== void 0 && /* @__PURE__ */ jsx21("span", { className: "text-xs text-neutral-500 dark:text-neutral-400", children: formatAt(at) })
    ] }),
    body !== void 0 && /* @__PURE__ */ jsx21("div", { className: "mt-0.5 text-sm text-neutral-600 dark:text-neutral-400", children: body }),
    by !== void 0 && /* @__PURE__ */ jsx21("div", { className: "mt-1.5 flex items-center gap-2 text-xs", children: by }),
    children !== void 0 && /* @__PURE__ */ jsx21("div", { className: "mt-2", children })
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
import { Fragment as Fragment4, jsx as jsx22, jsxs as jsxs21 } from "react/jsx-runtime";
var SIZES2 = {
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
function Avatar({ name, src, size = "md", fallback, className, ...props }) {
  const label = name?.trim() || "Unknown person";
  return /* @__PURE__ */ jsx22(
    "span",
    {
      title: name || void 0,
      className: cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
        SIZES2[size],
        className
      ),
      ...props,
      children: src ? (
        // A picture that 404s must leave the initials showing rather than the
        // browser's broken-image glyph, so the initials are painted behind it
        // and the <img> simply hides itself when it cannot load.
        /* @__PURE__ */ jsxs21(Fragment4, { children: [
          /* @__PURE__ */ jsx22("span", { "aria-hidden": "true", className: "absolute inset-0 flex items-center justify-center", children: fallback ?? initials(label) }),
          /* @__PURE__ */ jsx22(
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
      ) : /* @__PURE__ */ jsx22("span", { "aria-label": label, role: "img", children: fallback ?? initials(label) })
    }
  );
}
function AvatarGroup({ max = 4, size = "sm", children, className, ...props }) {
  const all = Children6.toArray(children);
  const shown = all.slice(0, max);
  const extra = all.length - shown.length;
  return /* @__PURE__ */ jsxs21("div", { className: cn("flex items-center", className), ...props, children: [
    shown.map((child, i) => /* @__PURE__ */ jsx22(
      "span",
      {
        className: cn(
          "rounded-full ring-white dark:ring-neutral-900",
          i === 0 ? "ml-0 ring-2" : RING[size]
        ),
        children: child
      },
      i
    )),
    extra > 0 && /* @__PURE__ */ jsxs21(
      "span",
      {
        className: cn(
          "inline-flex items-center justify-center rounded-full bg-neutral-100 font-medium text-neutral-600 ring-2 ring-white dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-900",
          SIZES2[size],
          RING[size]
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

// src/components/breadcrumbs.tsx
import { Fragment as Fragment5 } from "react";
import { jsx as jsx23, jsxs as jsxs22 } from "react/jsx-runtime";
function Breadcrumbs({
  items: items2,
  onNavigate,
  label = "Breadcrumb",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx23("nav", { "aria-label": label, className: cn("text-left text-sm", className), ...props, children: /* @__PURE__ */ jsx23("ol", { className: "flex flex-wrap items-center gap-1.5 text-neutral-500 dark:text-neutral-400", children: items2.map((item, i) => {
    const last = i === items2.length - 1;
    const linkClasses = cn(
      "rounded px-0.5 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100",
      focusRing
    );
    return /* @__PURE__ */ jsxs22(Fragment5, { children: [
      /* @__PURE__ */ jsx23("li", { children: last || !item.path ? /* @__PURE__ */ jsx23(
        "span",
        {
          "aria-current": last ? "page" : void 0,
          className: cn(last && "font-medium text-neutral-900 dark:text-neutral-100"),
          children: item.label
        }
      ) : onNavigate ? /* @__PURE__ */ jsx23(
        "button",
        {
          type: "button",
          onClick: () => onNavigate(item.path),
          className: linkClasses,
          children: item.label
        }
      ) : /* @__PURE__ */ jsx23("a", { href: item.path, className: linkClasses, children: item.label }) }),
      !last && /* @__PURE__ */ jsx23("li", { "aria-hidden": "true", className: "select-none text-neutral-300 dark:text-neutral-600", children: "/" })
    ] }, i);
  }) }) });
}

// src/components/thread.tsx
import {
  useEffect as useEffect7,
  useRef as useRef6,
  useState as useState12
} from "react";

// src/components/markdown.tsx
import { jsx as jsx24 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx24("div", { className: cn(prose, "text-left", className), children: /* @__PURE__ */ jsx24(Xa, { mode: "streaming", isAnimating: streaming, children: children ?? "" }) });
}

// src/components/thread.tsx
import { jsx as jsx25, jsxs as jsxs23 } from "react/jsx-runtime";
function Thread({
  messages,
  onSend,
  action,
  params,
  placeholder,
  busy,
  emptyState = "Nothing here yet.",
  height = 360,
  readOnly = false,
  sendLabel,
  className
}) {
  const listRef = useRef6(null);
  const count = messages.length;
  const lastBody = messages[count - 1]?.body;
  useEffect7(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count, lastBody]);
  return /* @__PURE__ */ jsxs23("div", { className: cn("flex flex-col text-left", className), children: [
    /* @__PURE__ */ jsx25(
      "div",
      {
        ref: listRef,
        role: "log",
        "aria-live": "polite",
        "aria-label": "Conversation",
        style: { maxHeight: height },
        className: "flex-1 space-y-3 overflow-y-auto pr-1",
        children: count === 0 ? /* @__PURE__ */ jsx25("p", { className: "py-8 text-center text-sm text-neutral-500 dark:text-neutral-400", children: emptyState }) : messages.map((m, i) => /* @__PURE__ */ jsx25(Message, { message: m }, m.id ?? i))
      }
    ),
    !readOnly && /* @__PURE__ */ jsx25(
      Composer,
      {
        className: "mt-3",
        onSend,
        action,
        params,
        placeholder,
        busy,
        sendLabel
      }
    )
  ] });
}
function Message({ message, className }) {
  const { author, avatarUrl, at, body, own, streaming } = message;
  return /* @__PURE__ */ jsxs23("div", { className: cn("flex items-start gap-2.5", own && "flex-row-reverse", className), children: [
    /* @__PURE__ */ jsx25(Avatar, { size: "sm", name: author, src: avatarUrl, className: "mt-0.5" }),
    /* @__PURE__ */ jsxs23("div", { className: cn("min-w-0 max-w-[85%]", own && "text-right"), children: [
      /* @__PURE__ */ jsxs23(
        "div",
        {
          className: cn(
            "flex items-baseline gap-2 text-xs text-neutral-500 dark:text-neutral-400",
            own && "flex-row-reverse"
          ),
          children: [
            /* @__PURE__ */ jsx25("span", { className: "font-medium text-neutral-700 dark:text-neutral-300", children: author ?? "The robot" }),
            at !== void 0 && /* @__PURE__ */ jsx25("span", { children: formatAt2(at) })
          ]
        }
      ),
      /* @__PURE__ */ jsx25(
        "div",
        {
          className: cn(
            "mt-1 inline-block rounded-lg px-3 py-2 text-left",
            own ? "bg-[color:var(--rm-accent)] text-white" : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
          ),
          children: /* @__PURE__ */ jsx25(Markdown, { streaming, className: own ? "text-white" : void 0, children: body })
        }
      )
    ] })
  ] });
}
function Composer({
  onSend,
  action,
  params,
  placeholder = "Write a message",
  busy,
  disabled,
  sendLabel = "Send",
  className
}) {
  const [text, setText] = useState12("");
  const working = busy ?? action?.loading ?? false;
  const send = () => {
    const body = text.trim();
    if (!body || working || disabled) return;
    setText("");
    onSend?.(body);
    if (action) {
      void runAction(action, params ? params(body) : { text: body }).catch(() => void 0);
    }
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };
  return /* @__PURE__ */ jsxs23("div", { className: cn("flex items-end gap-2", className), children: [
    /* @__PURE__ */ jsx25(
      "textarea",
      {
        rows: 1,
        value: text,
        placeholder,
        disabled,
        onChange: (e) => setText(e.target.value),
        onKeyDown,
        "aria-label": placeholder,
        className: cn(inputBase, "max-h-40 min-h-[38px] resize-y py-2", focusRing)
      }
    ),
    /* @__PURE__ */ jsx25(
      Button,
      {
        onClick: send,
        loading: working,
        disabled: disabled || text.trim() === "",
        "data-rm-action": action?.name,
        children: sendLabel
      }
    )
  ] });
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

// src/components/data-table.tsx
import {
  useCallback as useCallback3,
  useEffect as useEffect9,
  useMemo as useMemo2,
  useRef as useRef7,
  useState as useState14
} from "react";

// src/components/empty-state.tsx
import { jsx as jsx26, jsxs as jsxs24 } from "react/jsx-runtime";
function EmptyState({ icon, title, description, action, className, ...props }) {
  return /* @__PURE__ */ jsxs24(
    "div",
    {
      className: cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center dark:border-neutral-700",
        className
      ),
      ...props,
      children: [
        icon !== void 0 ? /* @__PURE__ */ jsx26("div", { "aria-hidden": "true", className: "mb-1 text-neutral-400 dark:text-neutral-500", children: icon }) : /* @__PURE__ */ jsx26(
          "svg",
          {
            "aria-hidden": "true",
            className: "mb-1 h-8 w-8 text-neutral-300 dark:text-neutral-600",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            children: /* @__PURE__ */ jsx26(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                d: "M20 13V7a2 2 0 0 0-2-2h-3.5l-1-2h-3l-1 2H6a2 2 0 0 0-2 2v6m16 0v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4m16 0h-5a3 3 0 0 1-6 0H4"
              }
            )
          }
        ),
        /* @__PURE__ */ jsx26("h3", { className: "text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: title }),
        description !== void 0 && /* @__PURE__ */ jsx26("p", { className: "max-w-sm text-sm text-neutral-500 dark:text-neutral-400", children: description }),
        action !== void 0 && /* @__PURE__ */ jsx26("div", { className: "mt-3", children: action })
      ]
    }
  );
}

// src/components/error-state.tsx
import { useEffect as useEffect8, useState as useState13 } from "react";
import { AppError } from "@robomotion/apps-runtime";
import { useMaybeAppClient as useMaybeAppClient2 } from "@robomotion/apps-runtime/react";
import { jsx as jsx27, jsxs as jsxs25 } from "react/jsx-runtime";
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
  const [state, setState] = useState13(app?.connection.state);
  useEffect8(() => {
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
  return /* @__PURE__ */ jsxs25(
    "div",
    {
      role: "alert",
      className: cn(
        "flex flex-col items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-left dark:border-red-500/30 dark:bg-red-500/10",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsxs25("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx27(
            "svg",
            {
              "aria-hidden": "true",
              className: "h-5 w-5 shrink-0 text-red-500",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.75",
              children: /* @__PURE__ */ jsx27(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                }
              )
            }
          ),
          /* @__PURE__ */ jsx27("h3", { className: "text-sm font-semibold text-red-800 dark:text-red-300", children: heading })
        ] }),
        /* @__PURE__ */ jsx27("p", { className: "text-sm text-red-700 dark:text-red-300/90", children: messageOf(error) }),
        onRetry && retryable && /* @__PURE__ */ jsx27(Button, { variant: "secondary", size: "sm", className: "mt-1", onClick: onRetry, children: retryLabel })
      ]
    }
  );
}

// src/components/data-table.tsx
import { jsx as jsx28, jsxs as jsxs26 } from "react/jsx-runtime";
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
  const [filter, setFilter] = useState14("");
  const [sortKey, setSortKey] = useState14(null);
  const [sortDir, setSortDir] = useState14("asc");
  const [page, setPage] = useState14(0);
  const paged = !!source && isActionSource(source);
  const pagedAction = paged ? source.action : null;
  const actionName = pagedAction?.name ?? "";
  const actionRef = useRef7(pagedAction);
  actionRef.current = pagedAction;
  const effPageSize = paged ? source.pageSize ?? pageSize : pageSize;
  const [remote, setRemote] = useState14(null);
  const [remoteLoading, setRemoteLoading] = useState14(false);
  const [remoteError, setRemoteError] = useState14(null);
  const [reloadTick, setReloadTick] = useState14(0);
  const seq = useRef7(0);
  const ownFetch = useRef7(false);
  const superseded = useRef7(0);
  const [askedFilter, setAskedFilter] = useState14("");
  useEffect9(() => {
    if (!paged) return;
    const t = setTimeout(() => setAskedFilter(filter), 250);
    return () => clearTimeout(t);
  }, [filter, paged]);
  const paging = effPageSize > 0;
  const inMemoryTotal = useRef7(0);
  const total = paged ? remote?.total ?? rows.length : inMemoryTotal.current;
  const pageCount = paging ? Math.max(1, Math.ceil(total / effPageSize)) : 1;
  const clampedPage = Math.min(page, pageCount - 1);
  const fetchPage = useCallback3(async () => {
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
      const reply = await action.run(req);
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
  useEffect9(() => {
    if (!paged || !actionName) return;
    void fetchPage();
  }, [paged, actionName, fetchPage, reloadTick]);
  const wasLoading = useRef7(false);
  useEffect9(() => {
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
  useEffect9(() => {
    if (!paged) return;
    return onActionDone((name) => {
      if (name && name === actionRef.current?.name) return;
      setReloadTick((t) => t + 1);
    });
  }, [paged]);
  const refresh = useCallback3(() => {
    const name = actionRef.current?.name;
    if (name) clearSourceFetches(name);
    setRemoteError(null);
    setReloadTick((t) => t + 1);
  }, []);
  const filtered = useMemo2(() => {
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
  const sorted = useMemo2(() => {
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
  useEffect9(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);
  const keyOf = useCallback3(
    (row, index) => rowKey ? rowKey(row) : String(clampedPage * effPageSize + index),
    [rowKey, clampedPage, effPageSize]
  );
  const [ownKeys, setOwnKeys] = useState14(defaultSelectedKeys ?? []);
  const [allMatching, setAllMatching] = useState14(false);
  const keys = selectedKeys ?? ownKeys;
  const keySet = useMemo2(() => new Set(keys), [keys]);
  const seen = useRef7(/* @__PURE__ */ new Map());
  pageRows.forEach((row, i) => {
    if (selectable) seen.current.set(keyOf(row, i), row);
  });
  const rowsFor = useCallback3(
    (list) => list.map((k) => seen.current.get(k)).filter((r) => r !== void 0),
    []
  );
  const setKeys = useCallback3(
    (next) => {
      if (selectedKeys === void 0) setOwnKeys(next);
      onSelectionChange?.(next, next.map((k) => seen.current.get(k)).filter((r) => r !== void 0));
    },
    [selectedKeys, onSelectionChange]
  );
  const selectionCount = allMatching ? total : keys.length;
  const selection = useMemo2(
    () => allMatching ? { allMatching: true, filter, count: total } : { keys, rows: rowsFor(keys), filter, count: keys.length },
    [allMatching, keys, filter, total, rowsFor]
  );
  const clearSelection = useCallback3(() => {
    setAllMatching(false);
    if (selectedKeys === void 0) setOwnKeys([]);
    onSelectionChange?.([], []);
  }, [selectedKeys, onSelectionChange]);
  useEffect9(() => {
    setAllMatching(false);
  }, [askedFilter, filter]);
  const selectionRef = useRef7(selection);
  selectionRef.current = selection;
  useEffect9(() => {
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
  const pageKeys = useMemo2(
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
  const afterOwnWrite = useCallback3(() => {
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
  const [exporting, setExporting] = useState14(false);
  const exportColumns = useMemo2(() => columns.filter((c) => !c.noExport), [columns]);
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
        const reply = await actionRef.current.run(req);
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
  const linkAttrs = useMemo2(
    () => source ? sourceLinkAttrs(source) : rowsLinkAttrs(rows),
    [rows, source]
  );
  const columnCount = columns.length + (rowActions?.length ? 1 : 0) + (selectable ? 1 : 0);
  const offerAllMatching = selectable && pageAllSelected && !allMatching && total > pageKeys.length && paging;
  return /* @__PURE__ */ jsxs26("div", { className: cn("text-left", className), ...linkAttrs, children: [
    (filterable || exportable) && /* @__PURE__ */ jsxs26("div", { className: "mb-3 flex flex-wrap items-center gap-2", children: [
      filterable && /* @__PURE__ */ jsx28("div", { className: "max-w-xs flex-1", children: /* @__PURE__ */ jsx28(
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
      exportable && /* @__PURE__ */ jsx28(
        Button,
        {
          variant: "secondary",
          size: "sm",
          className: "ml-auto",
          loading: exporting,
          onClick: () => void exportCsv(),
          children: "Export CSV"
        }
      )
    ] }),
    selectable && selectionCount > 0 && /* @__PURE__ */ jsxs26(
      "div",
      {
        role: "region",
        "aria-label": "Selected rows",
        "data-rm-action": bulkNames,
        className: "mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/60",
        children: [
          /* @__PURE__ */ jsx28("span", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-200", children: allMatching ? `All ${total} selected` : `${selectionCount} selected` }),
          offerAllMatching && /* @__PURE__ */ jsxs26(
            "button",
            {
              type: "button",
              onClick: selectAllMatching,
              className: cn(
                "rounded text-sm font-medium text-[color:var(--rm-accent)] underline underline-offset-2",
                focusRing
              ),
              children: [
                "Select all ",
                total
              ]
            }
          ),
          /* @__PURE__ */ jsxs26("div", { className: "ml-auto flex flex-wrap items-center gap-2", children: [
            (bulkActions ?? []).map((a) => /* @__PURE__ */ jsx28(
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
            /* @__PURE__ */ jsx28(Button, { size: "sm", variant: "ghost", onClick: clearSelection, children: "Clear" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx28("div", { className: "overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxs26("table", { className: "w-full border-collapse bg-white text-sm dark:bg-neutral-900", children: [
      caption && /* @__PURE__ */ jsx28("caption", { className: "sr-only", children: caption }),
      /* @__PURE__ */ jsx28("thead", { children: /* @__PURE__ */ jsxs26("tr", { className: "border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60", children: [
        selectable && /* @__PURE__ */ jsx28("th", { scope: "col", className: "w-10 px-3 py-2.5", children: /* @__PURE__ */ jsx28(
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
          return /* @__PURE__ */ jsx28(
            "th",
            {
              scope: "col",
              "aria-sort": active ? sortDir === "asc" ? "ascending" : "descending" : void 0,
              className: cn(
                "px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
                alignClass(col.align),
                col.className
              ),
              children: col.sortable ? /* @__PURE__ */ jsxs26(
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
                    /* @__PURE__ */ jsx28(SortIcon, { active, dir: sortDir })
                  ]
                }
              ) : col.header
            },
            col.key
          );
        }),
        rowActions && rowActions.length > 0 && /* @__PURE__ */ jsx28("th", { scope: "col", className: "w-12 px-3 py-2.5", children: /* @__PURE__ */ jsx28("span", { className: "sr-only", children: "Actions" }) })
      ] }) }),
      /* @__PURE__ */ jsxs26("tbody", { children: [
        busy && /* @__PURE__ */ jsx28("tr", { children: /* @__PURE__ */ jsx28(
          "td",
          {
            colSpan: columnCount,
            className: "px-3 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400",
            children: "Loading"
          }
        ) }),
        !busy && pageRows.map((row, i) => {
          const key = keyOf(row, i);
          const ticked = allMatching || keySet.has(key);
          return /* @__PURE__ */ jsxs26(
            "tr",
            {
              onClick: onRowClick ? () => onRowClick(row) : void 0,
              "aria-selected": selectable ? ticked : void 0,
              className: cn(
                "border-b border-neutral-100 last:border-b-0 dark:border-neutral-800",
                onRowClick && "cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
                ticked && "bg-neutral-50 dark:bg-neutral-800/40"
              ),
              children: [
                selectable && /* @__PURE__ */ jsx28("td", { className: "px-3 py-2.5", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx28(
                  TickBox,
                  {
                    label: `Select row ${i + 1}`,
                    checked: ticked,
                    onChange: () => toggleRow(key)
                  }
                ) }),
                columns.map((col) => /* @__PURE__ */ jsx28(
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
                rowActions && rowActions.length > 0 && /* @__PURE__ */ jsx28("td", { className: "px-2 py-1.5 text-right", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx28(Menu, { items: rowMenuItems(row, rowActions, afterOwnWrite) }) })
              ]
            },
            key
          );
        }),
        showEmpty && /* @__PURE__ */ jsx28("tr", { children: /* @__PURE__ */ jsx28("td", { colSpan: columnCount, className: "p-0", children: remoteError ? /* @__PURE__ */ jsx28(ErrorState, { className: "m-3", error: remoteError, onRetry: refresh }) : emptyState ?? /* @__PURE__ */ jsx28(
          EmptyState,
          {
            className: "rounded-none border-0",
            title: emptyTitle,
            description: emptyDescription ?? (filter ? "No rows match the current filter." : void 0)
          }
        ) }) })
      ] })
    ] }) }),
    paging && total > effPageSize && /* @__PURE__ */ jsxs26(
      "nav",
      {
        "aria-label": "Table pagination",
        className: "mt-3 flex items-center justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-400",
        children: [
          /* @__PURE__ */ jsxs26("span", { children: [
            "Showing ",
            clampedPage * effPageSize + 1,
            " to",
            " ",
            Math.min((clampedPage + 1) * effPageSize, total),
            " of ",
            total
          ] }),
          /* @__PURE__ */ jsxs26("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx28(
              PagerButton,
              {
                label: "Previous page",
                disabled: clampedPage === 0,
                onClick: () => setPage(clampedPage - 1),
                children: "Previous"
              }
            ),
            /* @__PURE__ */ jsxs26("span", { "aria-current": "page", className: "tabular-nums", children: [
              clampedPage + 1,
              " / ",
              pageCount
            ] }),
            /* @__PURE__ */ jsx28(
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
    ),
    exporting && /* @__PURE__ */ jsx28("span", { className: "sr-only", role: "status", children: "Preparing the export" })
  ] });
}
function TickBox({
  label,
  checked,
  indeterminate = false,
  onChange
}) {
  const ref = useRef7(null);
  useEffect9(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return /* @__PURE__ */ jsx28(
    "input",
    {
      ref,
      type: "checkbox",
      "aria-label": label,
      checked,
      onChange,
      className: cn(
        "h-4 w-4 cursor-pointer rounded border-neutral-300 text-[color:var(--rm-accent)] accent-[var(--rm-accent)] dark:border-neutral-600",
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
    return /* @__PURE__ */ jsx28("span", { className: "text-neutral-400 dark:text-neutral-600", children: "-" });
  }
  return String(v);
}
function SortIcon({ active, dir }) {
  return /* @__PURE__ */ jsx28(
    "svg",
    {
      "aria-hidden": "true",
      className: cn("h-3 w-3", active ? "opacity-100" : "opacity-30"),
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      children: !active || dir === "asc" ? /* @__PURE__ */ jsx28("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m6 14 6-6 6 6" }) : /* @__PURE__ */ jsx28("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m6 10 6 6 6-6" })
    }
  );
}
function PagerButton({
  label,
  disabled,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx28(
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

// src/components/kanban.tsx
import {
  Children as Children7,
  createContext as createContext4,
  isValidElement as isValidElement4,
  useContext as useContext4,
  useEffect as useEffect10,
  useRef as useRef8,
  useState as useState15
} from "react";
import { jsx as jsx29, jsxs as jsxs27 } from "react/jsx-runtime";
var KanbanContext = createContext4(null);
function Kanban({ onMove, action, className, children }) {
  const items2 = Children7.toArray(children);
  const columns = [];
  for (const c of items2) {
    if (isValidElement4(c) && c.type === KanbanColumn) columns.push(String(c.props.id));
  }
  const [dragKey, setDragKey] = useState15(null);
  const [dragFrom, setDragFrom] = useState15(null);
  const [dragOffset, setDragOffset] = useState15({ x: 0, y: 0 });
  const [overColumn, setOverColumn] = useState15(null);
  const origin = useRef8({ x: 0, y: 0 });
  const latest = useRef8({
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
  useEffect10(() => {
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
  return /* @__PURE__ */ jsx29(KanbanContext.Provider, { value: ctx, children: /* @__PURE__ */ jsx29(
    "div",
    {
      className: cn("flex gap-4 overflow-x-auto pb-2 text-left", className),
      "data-rm-action": action?.name,
      children: items2
    }
  ) });
}
function KanbanColumn({ id, title, meta, emptyState, className, children }) {
  const ctx = useContext4(KanbanContext);
  const over = ctx?.overColumn === id && ctx?.dragFrom !== id;
  const cards = Children7.toArray(children);
  return /* @__PURE__ */ jsxs27(
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
        /* @__PURE__ */ jsxs27("header", { className: "flex items-center justify-between gap-2 px-3 py-2", children: [
          /* @__PURE__ */ jsx29("h3", { className: "text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: title }),
          /* @__PURE__ */ jsx29("span", { className: "text-xs text-neutral-500 dark:text-neutral-400", children: meta ?? cards.length })
        ] }),
        /* @__PURE__ */ jsx29("ul", { className: "flex min-h-[4rem] flex-1 flex-col gap-2 p-2", children: cards.length > 0 ? cards : /* @__PURE__ */ jsx29("li", { className: "rounded-md border border-dashed border-neutral-300 px-3 py-6 text-center text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400", children: emptyState ?? "Nothing here" }) })
      ]
    }
  );
}
function KanbanCard({ id, column, disabled = false, className, children }) {
  const ctx = useContext4(KanbanContext);
  const ref = useRef8(null);
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
  return /* @__PURE__ */ jsx29(
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
import { useMemo as useMemo3, useState as useState16 } from "react";
import { Fragment as Fragment6, jsx as jsx30, jsxs as jsxs28 } from "react/jsx-runtime";
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
  const [ownMonth, setOwnMonth] = useState16(
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
  const byDate = useMemo3(() => {
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
  return /* @__PURE__ */ jsxs28("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsxs28("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx30(NavButton, { label: "Previous month", onClick: () => goto(-1), dir: "prev" }),
      /* @__PURE__ */ jsx30("h3", { className: "text-sm font-semibold text-neutral-900 dark:text-neutral-100", children: heading }),
      /* @__PURE__ */ jsx30(NavButton, { label: "Next month", onClick: () => goto(1), dir: "next" })
    ] }),
    /* @__PURE__ */ jsxs28(
      "div",
      {
        role: "group",
        "aria-label": heading,
        className: "overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800",
        children: [
          /* @__PURE__ */ jsx30("div", { "aria-hidden": "true", className: "grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60", children: weekdays.map((w) => /* @__PURE__ */ jsx30(
            "div",
            {
              className: "px-2 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
              children: w
            },
            w
          )) }),
          /* @__PURE__ */ jsx30("div", { className: "grid grid-cols-7 bg-white dark:bg-neutral-900", children: cells.map((day, i) => {
            if (day === null) {
              return /* @__PURE__ */ jsx30("div", { className: "min-h-[4.5rem] border-b border-r border-neutral-100 last:border-r-0 dark:border-neutral-800" }, `pad-${i}`);
            }
            const date = iso(year, monthIndex, day);
            const dayEvents = byDate.get(date) ?? [];
            const isSelected = selected === date;
            const isToday = date === todayIso;
            const body = /* @__PURE__ */ jsxs28(Fragment6, { children: [
              /* @__PURE__ */ jsx30(
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
              /* @__PURE__ */ jsxs28("span", { className: "mt-1 flex flex-col gap-0.5", children: [
                dayEvents.slice(0, maxPerDay).map((e, j) => /* @__PURE__ */ jsx30(
                  "span",
                  {
                    className: "truncate rounded bg-[color:var(--rm-accent)]/10 px-1 py-0.5 text-[11px] text-neutral-800 dark:text-neutral-200",
                    children: e.label
                  },
                  j
                )),
                dayEvents.length > maxPerDay && /* @__PURE__ */ jsxs28("span", { className: "px-1 text-[11px] text-neutral-500 dark:text-neutral-400", children: [
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
              return /* @__PURE__ */ jsx30("div", { className: cellClass, children: body }, date);
            }
            const fullDate = new Date(year, monthIndex, day).toLocaleDateString(void 0, {
              dateStyle: "full"
            });
            return /* @__PURE__ */ jsx30(
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
  return /* @__PURE__ */ jsx30(
    "button",
    {
      type: "button",
      "aria-label": label,
      onClick,
      className: cn(
        "rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        focusRing
      ),
      children: /* @__PURE__ */ jsx30("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx30(
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

// src/components/json-view.tsx
import { useState as useState17 } from "react";
import { jsx as jsx31, jsxs as jsxs29 } from "react/jsx-runtime";
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
  const [copied, setCopied] = useState17(false);
  if (isEmpty(value)) {
    return /* @__PURE__ */ jsx31(
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
  return /* @__PURE__ */ jsxs29(
    "div",
    {
      className: cn(
        "relative rounded-md border border-neutral-200 bg-neutral-50 p-3 text-left font-mono text-xs leading-relaxed dark:border-neutral-800 dark:bg-neutral-900/60",
        className
      ),
      children: [
        copyable && /* @__PURE__ */ jsx31(
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
        /* @__PURE__ */ jsx31("ul", { role: "tree", "aria-label": label, className: cn("m-0 list-none p-0", copyable && "pr-14"), children: /* @__PURE__ */ jsx31(Node, { name: null, value, depth: 0, maxDepth }) })
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
  const [open, setOpen] = useState17(depth < maxDepth);
  if (!branch) {
    return /* @__PURE__ */ jsxs29("li", { role: "treeitem", className: "whitespace-pre-wrap break-words", children: [
      name !== null && /* @__PURE__ */ jsx31(Key, { name }),
      /* @__PURE__ */ jsx31(Leaf, { value })
    ] });
  }
  const array = Array.isArray(value);
  const entries = array ? value.map((v, i) => [String(i), v]) : Object.entries(value);
  const summary = array ? `[${entries.length} ${entries.length === 1 ? "item" : "items"}]` : `{${entries.length} ${entries.length === 1 ? "field" : "fields"}}`;
  return /* @__PURE__ */ jsxs29("li", { role: "treeitem", "aria-expanded": open, children: [
    /* @__PURE__ */ jsxs29(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        className: cn(
          "inline-flex max-w-full items-center gap-1 rounded text-left text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
          focusRing
        ),
        children: [
          /* @__PURE__ */ jsx31("span", { "aria-hidden": "true", className: cn("transition-transform", open && "rotate-90"), children: "\u203A" }),
          name !== null ? /* @__PURE__ */ jsx31(Key, { name }) : null,
          /* @__PURE__ */ jsx31("span", { className: "text-neutral-400 dark:text-neutral-500", children: summary })
        ]
      }
    ),
    open && /* @__PURE__ */ jsx31("ul", { role: "group", className: "m-0 list-none border-l border-neutral-200 pl-3 dark:border-neutral-800", children: entries.map(([key, v]) => /* @__PURE__ */ jsx31(Node, { name: key, value: v, depth: depth + 1, maxDepth }, key)) })
  ] });
}
function Key({ name }) {
  return /* @__PURE__ */ jsxs29("span", { className: "text-neutral-500 dark:text-neutral-400", children: [
    name,
    ": "
  ] });
}
function Leaf({ value }) {
  if (typeof value === "string") {
    return /* @__PURE__ */ jsxs29("span", { className: "text-emerald-700 dark:text-emerald-400", children: [
      '"',
      value,
      '"'
    ] });
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return /* @__PURE__ */ jsx31("span", { className: "text-blue-700 dark:text-blue-400", children: String(value) });
  }
  if (typeof value === "boolean") {
    return /* @__PURE__ */ jsx31("span", { className: "text-purple-700 dark:text-purple-400", children: String(value) });
  }
  if (value === null) return /* @__PURE__ */ jsx31("span", { className: "text-neutral-400 dark:text-neutral-500", children: "null" });
  if (value === void 0) return /* @__PURE__ */ jsx31("span", { className: "text-neutral-400 dark:text-neutral-500", children: "-" });
  return /* @__PURE__ */ jsx31("span", { className: "text-neutral-700 dark:text-neutral-300", children: String(value) });
}

// src/components/form.tsx
import {
  createContext as createContext5,
  useCallback as useCallback4,
  useContext as useContext5,
  useEffect as useEffect11,
  useId as useId9,
  useMemo as useMemo4,
  useRef as useRef9,
  useState as useState18
} from "react";
import { Fragment as Fragment7, jsx as jsx32, jsxs as jsxs30 } from "react/jsx-runtime";
var FormContext = createContext5(null);
var FieldContext = createContext5(null);
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
function isEmpty2(value) {
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
    if (isEmpty2(value)) {
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
        if (isEmpty2(row)) {
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
  const [ownValues, setOwnValues] = useState18(initialValues ?? {});
  const [errors, setErrors] = useState18({});
  const values = controlledValues ?? ownValues;
  const formRef = useRef9(null);
  useEffect11(() => {
    const form = formRef.current;
    if (!form || !action) return;
    const target = submitControlOf(form) ?? form;
    const current = (target.getAttribute("data-rm-action") ?? "").split(/\s+/).filter(Boolean);
    if (!current.includes(action.name)) {
      target.setAttribute("data-rm-action", [...current, action.name].join(" "));
    }
  });
  const latest = useRef9(values);
  latest.current = values;
  const setValue = useCallback4(
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
  const ctx = useMemo4(
    () => ({ values, errors, disabled, setValue }),
    [values, errors, disabled, setValue]
  );
  return /* @__PURE__ */ jsx32(FormContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs30(
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
        !hideError && action?.error ? /* @__PURE__ */ jsx32(ErrorState, { error: action.error, className: "mt-3" }) : null
      ]
    }
  ) });
}
function useFormValues() {
  return useContext5(FormContext)?.values ?? {};
}
function Field({ name, label, help, required = false, error, className, children }) {
  const form = useContext5(FormContext);
  const id = useId9();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const shownError = error ?? form?.errors[name];
  const describedBy = [help !== void 0 ? helpId : null, shownError ? errorId : null].filter(Boolean).join(" ") || void 0;
  const ctx = useMemo4(
    () => ({ name, id, describedBy, invalid: Boolean(shownError), required }),
    [name, id, describedBy, shownError, required]
  );
  return /* @__PURE__ */ jsx32(FieldContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs30("div", { className: cn("flex flex-col gap-1.5", className), children: [
    /* @__PURE__ */ jsxs30("label", { htmlFor: id, className: "text-sm font-medium text-neutral-800 dark:text-neutral-200", children: [
      label,
      required && /* @__PURE__ */ jsx32("span", { "aria-hidden": "true", className: "ml-0.5 text-red-500", children: "*" })
    ] }),
    children,
    help !== void 0 && /* @__PURE__ */ jsx32("p", { id: helpId, className: "text-xs text-neutral-500 dark:text-neutral-400", children: help }),
    shownError && /* @__PURE__ */ jsx32("p", { id: errorId, className: "text-xs font-medium text-red-600 dark:text-red-400", children: shownError })
  ] }) });
}
function useControl(explicitId) {
  const form = useContext5(FormContext);
  const field = useContext5(FieldContext);
  const fallbackId = useId9();
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
  return /* @__PURE__ */ jsx32(
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
  return /* @__PURE__ */ jsx32(
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
  return /* @__PURE__ */ jsx32(
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
  useEffect11(() => {
    if (seed !== void 0) write(seed);
  }, [seed]);
  return /* @__PURE__ */ jsxs30(
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
        placeholder !== void 0 && /* @__PURE__ */ jsx32("option", { value: "", disabled: true, children: placeholder }),
        options.map((opt) => /* @__PURE__ */ jsx32("option", { value: opt.value, disabled: opt.disabled, children: opt.label }, opt.value))
      ]
    }
  );
}
function Checkbox({ checked, onChange, label, className, id, disabled, ...props }) {
  const c = useControl(id);
  const current = checked ?? Boolean(c.read());
  return /* @__PURE__ */ jsxs30(
    "label",
    {
      className: cn(
        "inline-flex cursor-pointer select-none items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200",
        (disabled || c.disabled) && "cursor-not-allowed opacity-60",
        className
      ),
      children: [
        /* @__PURE__ */ jsx32(
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
  return /* @__PURE__ */ jsx32(
    "div",
    {
      role: "radiogroup",
      "aria-describedby": c.ariaProps["aria-describedby"],
      "aria-invalid": c.ariaProps["aria-invalid"],
      className: cn("flex flex-col gap-2", className),
      children: options.map((opt) => /* @__PURE__ */ jsxs30(
        "label",
        {
          className: cn(
            "inline-flex cursor-pointer select-none items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200",
            (disabled || c.disabled || opt.disabled) && "cursor-not-allowed opacity-60"
          ),
          children: [
            /* @__PURE__ */ jsx32(
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
  return /* @__PURE__ */ jsx32(
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
  return /* @__PURE__ */ jsx32(
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
  min = 0,
  max,
  reorder = true,
  emptyText = "Nothing added yet.",
  children,
  className
}) {
  const form = useContext5(FormContext);
  const helpId = useId9();
  const raw = form?.values[name];
  const rows = useMemo4(
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
  return /* @__PURE__ */ jsxs30("div", { className: cn("flex flex-col gap-2 text-left", className), children: [
    label !== void 0 && /* @__PURE__ */ jsx32("span", { className: "text-sm font-medium text-neutral-800 dark:text-neutral-200", children: label }),
    rows.length === 0 && /* @__PURE__ */ jsx32("p", { className: "rounded-md border border-dashed border-neutral-300 px-3 py-4 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400", children: emptyText }),
    rows.map((row, i) => /* @__PURE__ */ jsx32(
      FieldArrayRow,
      {
        form,
        arrayName: name,
        index: i,
        row,
        disabled,
        canRemove: !disabled && rows.length > min,
        canMoveUp: reorder && !disabled && i > 0,
        canMoveDown: reorder && !disabled && i < rows.length - 1,
        onRemove: () => removeAt(i),
        onMove: (d) => move(i, d),
        children: children(row, i)
      },
      i
    )),
    help !== void 0 && /* @__PURE__ */ jsx32("p", { id: helpId, className: "text-xs text-neutral-500 dark:text-neutral-400", children: help }),
    arrayError && /* @__PURE__ */ jsx32("p", { className: "text-xs font-medium text-red-600 dark:text-red-400", children: arrayError }),
    (max === void 0 || rows.length < max) && /* @__PURE__ */ jsx32("div", { children: /* @__PURE__ */ jsx32(Button, { type: "button", variant: "secondary", size: "sm", disabled, onClick: add, children: addLabel }) })
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
  const errors = useMemo4(() => {
    const out = {};
    for (const [key, message] of Object.entries(form?.errors ?? {})) {
      if (key.startsWith(prefix)) out[key.slice(prefix.length)] = message;
    }
    return out;
  }, [form?.errors, prefix]);
  const ctx = useMemo4(
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
  return /* @__PURE__ */ jsx32(FormContext.Provider, { value: ctx, children: /* @__PURE__ */ jsxs30("div", { className: "flex items-start gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800", children: [
    /* @__PURE__ */ jsx32("div", { className: "flex min-w-0 flex-1 flex-col gap-3", children }),
    /* @__PURE__ */ jsxs30("div", { className: "flex shrink-0 flex-col gap-1", children: [
      (canMoveUp || canMoveDown) && /* @__PURE__ */ jsxs30(Fragment7, { children: [
        /* @__PURE__ */ jsx32(RowButton, { label: `Move row ${index + 1} up`, disabled: !canMoveUp, onClick: () => onMove(-1), children: /* @__PURE__ */ jsx32("svg", { "aria-hidden": "true", className: "h-3.5 w-3.5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx32("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m6 14 6-6 6 6" }) }) }),
        /* @__PURE__ */ jsx32(RowButton, { label: `Move row ${index + 1} down`, disabled: !canMoveDown, onClick: () => onMove(1), children: /* @__PURE__ */ jsx32("svg", { "aria-hidden": "true", className: "h-3.5 w-3.5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx32("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m6 10 6 6 6-6" }) }) })
      ] }),
      /* @__PURE__ */ jsx32(RowButton, { label: `Remove row ${index + 1}`, disabled: !canRemove, onClick: onRemove, danger: true, children: /* @__PURE__ */ jsx32("svg", { "aria-hidden": "true", className: "h-3.5 w-3.5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx32("path", { strokeLinecap: "round", d: "M6 6l12 12M18 6L6 18" }) }) })
    ] })
  ] }) });
}
function RowButton({
  label,
  disabled,
  onClick,
  danger = false,
  children
}) {
  return /* @__PURE__ */ jsx32(
    "button",
    {
      type: "button",
      "aria-label": label,
      disabled,
      onClick,
      className: cn(
        "rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30",
        danger ? "text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        focusRing
      ),
      children
    }
  );
}

// src/components/combobox.tsx
import {
  useCallback as useCallback5,
  useEffect as useEffect12,
  useId as useId10,
  useMemo as useMemo5,
  useRef as useRef10,
  useState as useState19
} from "react";
import { jsx as jsx33, jsxs as jsxs31 } from "react/jsx-runtime";
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
  const baseId = useId10();
  const bound = c.read();
  const raw = value ?? bound;
  const selected = useMemo5(
    () => multiple ? Array.isArray(raw) ? raw : raw ? [String(raw)] : [] : raw ? [String(raw)] : [],
    [multiple, raw]
  );
  const [open, setOpen] = useState19(false);
  const [query, setQuery] = useState19("");
  const [active, setActive] = useState19(0);
  const [loaded, setLoaded] = useState19([]);
  const [loading, setLoading] = useState19(false);
  const openPanel = () => {
    setOpen(true);
    setActive(0);
  };
  const rootRef = useRef10(null);
  const inputRef = useRef10(null);
  const off = disabled || c.disabled;
  const seq = useRef10(0);
  const loadRef = useRef10(loadOptions);
  loadRef.current = loadOptions;
  useEffect12(() => {
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
  const shown = useMemo5(() => {
    if (loadOptions || !query.trim()) return all;
    const needle = query.trim().toLowerCase();
    return all.filter(
      (o) => o.value.toLowerCase().includes(needle) || labelText(o.label).toLowerCase().includes(needle)
    );
  }, [all, query, loadOptions]);
  const enabled = useMemo5(() => shown.filter((o) => !o.disabled), [shown]);
  useEffect12(() => {
    if (active > enabled.length - 1) setActive(Math.max(0, enabled.length - 1));
  }, [enabled.length, active]);
  const labelFor = useCallback5(
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
  useEffect12(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
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
  return /* @__PURE__ */ jsxs31("div", { ref: rootRef, className: cn("relative text-left", className), children: [
    /* @__PURE__ */ jsxs31(
      "div",
      {
        className: cn(
          inputBase,
          "flex min-h-[38px] flex-wrap items-center gap-1.5 py-1.5",
          off && "cursor-not-allowed bg-neutral-100 dark:bg-neutral-800"
        ),
        onClick: () => {
          if (off) return;
          openPanel();
          inputRef.current?.focus();
        },
        children: [
          multiple && selected.map((v) => /* @__PURE__ */ jsxs31(
            "span",
            {
              className: "inline-flex items-center gap-1 rounded-full bg-neutral-100 py-0.5 pl-2 pr-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
              children: [
                labelFor(v),
                !off && /* @__PURE__ */ jsx33(
                  "button",
                  {
                    type: "button",
                    "aria-label": `Remove ${labelText(labelFor(v))}`,
                    onClick: (e) => {
                      e.stopPropagation();
                      commit(selected.filter((x) => x !== v));
                    },
                    className: cn("rounded-full p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-100", focusRing),
                    children: /* @__PURE__ */ jsx33("svg", { "aria-hidden": "true", className: "h-3 w-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx33("path", { strokeLinecap: "round", d: "M6 6l12 12M18 6L6 18" }) })
                  }
                )
              ]
            },
            v
          )),
          /* @__PURE__ */ jsx33(
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
              className: "min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed dark:text-neutral-100 dark:placeholder:text-neutral-500"
            }
          ),
          /* @__PURE__ */ jsx33(ChevronIcon2, {})
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs31(
      "ul",
      {
        id: `${baseId}-list`,
        role: "listbox",
        "aria-multiselectable": multiple || void 0,
        className: "absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900",
        children: [
          loading && shown.length === 0 && /* @__PURE__ */ jsx33("li", { className: "px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400", children: "Looking" }),
          !loading && shown.length === 0 && /* @__PURE__ */ jsx33("li", { className: "px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400", children: emptyText }),
          shown.map((opt) => {
            const on = selected.includes(opt.value);
            const highlighted = !opt.disabled && enabled[active]?.value === opt.value;
            return /* @__PURE__ */ jsxs31(
              "li",
              {
                id: `${baseId}-o-${opt.value}`,
                role: "option",
                "aria-selected": on,
                "aria-disabled": opt.disabled || void 0,
                onMouseDown: (e) => e.preventDefault(),
                onClick: () => pick(opt),
                className: cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-200",
                  highlighted && "bg-neutral-100 dark:bg-neutral-800",
                  opt.disabled && "cursor-not-allowed opacity-50"
                ),
                children: [
                  /* @__PURE__ */ jsx33("span", { className: "min-w-0 flex-1 truncate", children: opt.label }),
                  on && /* @__PURE__ */ jsx33(TickIcon3, {})
                ]
              },
              opt.value
            );
          })
        ]
      }
    )
  ] });
}
function labelText(label) {
  return typeof label === "string" || typeof label === "number" ? String(label) : "";
}
function ChevronIcon2() {
  return /* @__PURE__ */ jsx33(
    "svg",
    {
      "aria-hidden": "true",
      className: "ml-auto h-4 w-4 shrink-0 text-neutral-400",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      children: /* @__PURE__ */ jsx33("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m6 9 6 6 6-6" })
    }
  );
}
function TickIcon3() {
  return /* @__PURE__ */ jsx33(
    "svg",
    {
      "aria-hidden": "true",
      className: "h-4 w-4 shrink-0 text-[color:var(--rm-accent)]",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      children: /* @__PURE__ */ jsx33("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m5 13 4 4L19 7" })
    }
  );
}

// src/components/date-range.tsx
import { useMemo as useMemo6 } from "react";
import { jsx as jsx34, jsxs as jsxs32 } from "react/jsx-runtime";
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
  min,
  max,
  fromLabel = "From",
  toLabel = "To",
  disabled,
  className
}) {
  const c = useControl();
  const bound = c.read();
  const current = value ?? bound ?? { from: "", to: "" };
  const off = disabled || c.disabled;
  const list = useMemo6(
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
  return /* @__PURE__ */ jsxs32("div", { className: cn("text-left", className), children: [
    list.length > 0 && /* @__PURE__ */ jsx34("div", { className: "mb-2 flex flex-wrap gap-1.5", children: list.map((p) => /* @__PURE__ */ jsx34(
      "button",
      {
        type: "button",
        disabled: off,
        "aria-pressed": active?.label === p.label,
        onClick: () => commit(p.range()),
        className: cn(
          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          active?.label === p.label ? "border-[color:var(--rm-accent)] bg-[color:var(--rm-accent)] text-white" : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
          focusRing
        ),
        children: p.label
      },
      p.label
    )) }),
    /* @__PURE__ */ jsxs32("div", { className: "flex flex-wrap items-end gap-3", children: [
      /* @__PURE__ */ jsxs32("label", { className: "flex min-w-[9rem] flex-1 flex-col gap-1", children: [
        /* @__PURE__ */ jsx34("span", { className: "text-xs font-medium text-neutral-600 dark:text-neutral-400", children: fromLabel }),
        /* @__PURE__ */ jsx34(
          "input",
          {
            type: "date",
            value: current.from,
            min,
            max: current.to || max,
            disabled: off,
            onChange: (e) => setFrom(e.target.value),
            ...c.ariaProps,
            className: cn(inputBase, "h-9")
          }
        )
      ] }),
      /* @__PURE__ */ jsxs32("label", { className: "flex min-w-[9rem] flex-1 flex-col gap-1", children: [
        /* @__PURE__ */ jsx34("span", { className: "text-xs font-medium text-neutral-600 dark:text-neutral-400", children: toLabel }),
        /* @__PURE__ */ jsx34(
          "input",
          {
            type: "date",
            value: current.to,
            min: current.from || min,
            max,
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
import { jsx as jsx35, jsxs as jsxs33 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs33("div", { className: cn("flex items-start gap-3 text-left", off && "opacity-60", className), children: [
    /* @__PURE__ */ jsx35(
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
          on ? "bg-[color:var(--rm-accent)]" : "bg-neutral-300 dark:bg-neutral-700",
          focusRing
        ),
        children: /* @__PURE__ */ jsx35(
          "span",
          {
            "aria-hidden": "true",
            className: cn(
              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform",
              on ? "translate-x-4" : "translate-x-0"
            )
          }
        )
      }
    ),
    (label !== void 0 || description !== void 0) && /* @__PURE__ */ jsxs33("span", { className: "min-w-0", children: [
      label !== void 0 && /* @__PURE__ */ jsx35(
        "button",
        {
          type: "button",
          disabled: off,
          onClick: toggle,
          className: "block cursor-pointer text-left text-sm font-medium text-neutral-800 disabled:cursor-not-allowed dark:text-neutral-200",
          children: label
        }
      ),
      description !== void 0 && /* @__PURE__ */ jsx35("span", { className: "mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400", children: description })
    ] })
  ] });
}

// src/components/tag-input.tsx
import { useRef as useRef11, useState as useState20 } from "react";
import { jsx as jsx36, jsxs as jsxs34 } from "react/jsx-runtime";
function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  unique = true,
  max,
  disabled,
  id,
  className
}) {
  const c = useControl(id);
  const bound = c.read();
  const tags = value ?? (Array.isArray(bound) ? bound : []);
  const [draft, setDraft] = useState20("");
  const inputRef = useRef11(null);
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
    if (max !== void 0 && tags.length >= max) return;
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
  return /* @__PURE__ */ jsxs34(
    "div",
    {
      onClick: () => inputRef.current?.focus(),
      className: cn(
        inputBase,
        "flex min-h-[38px] cursor-text flex-wrap items-center gap-1.5 py-1.5",
        off && "cursor-not-allowed bg-neutral-100 dark:bg-neutral-800",
        className
      ),
      children: [
        tags.map((tag, i) => /* @__PURE__ */ jsxs34(
          "span",
          {
            className: "inline-flex items-center gap-1 rounded-full bg-neutral-100 py-0.5 pl-2 pr-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
            children: [
              tag,
              !off && /* @__PURE__ */ jsx36(
                "button",
                {
                  type: "button",
                  "aria-label": `Remove ${tag}`,
                  onClick: (e) => {
                    e.stopPropagation();
                    removeAt(i);
                  },
                  className: cn(
                    "rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
                    focusRing
                  ),
                  children: /* @__PURE__ */ jsx36("svg", { "aria-hidden": "true", className: "h-3 w-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", children: /* @__PURE__ */ jsx36("path", { strokeLinecap: "round", d: "M6 6l12 12M18 6L6 18" }) })
                }
              )
            ]
          },
          `${tag}-${i}`
        )),
        /* @__PURE__ */ jsx36(
          "input",
          {
            ref: inputRef,
            id: c.id,
            type: "text",
            value: draft,
            disabled: off || max !== void 0 && tags.length >= max,
            placeholder: tags.length === 0 ? placeholder : "",
            onChange: (e) => setDraft(e.target.value),
            onKeyDown,
            onBlur: () => add(draft),
            ...c.ariaProps,
            className: "min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed dark:text-neutral-100 dark:placeholder:text-neutral-500"
          }
        )
      ]
    }
  );
}

// src/components/slider.tsx
import { jsx as jsx37, jsxs as jsxs35 } from "react/jsx-runtime";
function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  formatValue,
  minLabel,
  maxLabel,
  className,
  id,
  disabled,
  ...props
}) {
  const c = useControl(id);
  const bound = c.read();
  const current = value ?? (typeof bound === "number" && Number.isFinite(bound) ? bound : Math.round((min + max) / 2));
  const off = disabled || c.disabled;
  return /* @__PURE__ */ jsxs35("div", { className: cn("w-full text-left", className), children: [
    /* @__PURE__ */ jsxs35("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx37(
        "input",
        {
          id: c.id,
          type: "range",
          min,
          max,
          step,
          value: current,
          disabled: off,
          onChange: (e) => {
            const next = Number(e.target.value);
            onChange?.(next);
            c.write(next);
          },
          className: cn(
            "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-[var(--rm-accent)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-700",
            focusRing
          ),
          ...c.ariaProps,
          ...props
        }
      ),
      showValue && /* @__PURE__ */ jsx37(
        "output",
        {
          htmlFor: c.id,
          className: "w-12 shrink-0 text-right text-sm tabular-nums text-neutral-700 dark:text-neutral-300",
          children: formatValue ? formatValue(current) : current
        }
      )
    ] }),
    (minLabel !== void 0 || maxLabel !== void 0) && /* @__PURE__ */ jsxs35("div", { className: "mt-1 flex justify-between text-xs text-neutral-500 dark:text-neutral-400", children: [
      /* @__PURE__ */ jsx37("span", { children: minLabel }),
      /* @__PURE__ */ jsx37("span", { children: maxLabel })
    ] })
  ] });
}

// src/components/rating.tsx
import { useState as useState21 } from "react";
import { jsx as jsx38, jsxs as jsxs36 } from "react/jsx-runtime";
function Rating({
  value,
  onChange,
  max = 5,
  min = 1,
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
  const [hover, setHover] = useState21(null);
  const values = [];
  for (let v = min; v <= max; v++) values.push(v);
  const pick = (v) => {
    if (off) return;
    onChange?.(v);
    c.write(v);
  };
  const onKeyDown = (e) => {
    if (off) return;
    const at = current ?? min;
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(max, at + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(min, at - 1);
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    pick(next);
  };
  const shown = hover ?? current;
  return /* @__PURE__ */ jsxs36("div", { className: cn("flex items-center gap-2 text-left", className), children: [
    /* @__PURE__ */ jsx38(
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
          return /* @__PURE__ */ jsx38(
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
                "rounded transition-colors disabled:cursor-not-allowed",
                variant === "star" ? "p-0.5 text-neutral-300 dark:text-neutral-600" : "h-8 w-8 border border-neutral-300 text-sm font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-300",
                variant === "star" && on && "text-[color:var(--rm-accent)]",
                variant === "scale" && current === v && "border-[color:var(--rm-accent)] bg-[color:var(--rm-accent)] text-white"
              ),
              children: variant === "star" ? /* @__PURE__ */ jsx38(StarIcon, { filled: on }) : v
            },
            v
          );
        })
      }
    ),
    children
  ] });
}
function StarIcon({ filled }) {
  return /* @__PURE__ */ jsx38(
    "svg",
    {
      "aria-hidden": "true",
      className: "h-5 w-5",
      viewBox: "0 0 24 24",
      fill: filled ? "currentColor" : "none",
      stroke: "currentColor",
      strokeWidth: "1.5",
      children: /* @__PURE__ */ jsx38(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9L12 3.5Z"
        }
      )
    }
  );
}

// src/components/json-input.tsx
import { useEffect as useEffect13, useRef as useRef12, useState as useState22 } from "react";
import { jsx as jsx39, jsxs as jsxs37 } from "react/jsx-runtime";
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
  const [text, setText] = useState22(() => print(bound));
  const [invalid, setInvalid] = useState22(false);
  const ownWrite = useRef12(print(bound));
  useEffect13(() => {
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
  return /* @__PURE__ */ jsxs37("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsx39(
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
    invalid && /* @__PURE__ */ jsx39("p", { id: errorId, role: "alert", className: "text-xs font-medium text-red-600 dark:text-red-400", children: invalidMessage })
  ] });
}

// src/components/file-upload.tsx
import { useEffect as useEffect14, useRef as useRef13, useState as useState23 } from "react";
import { markGesture } from "@robomotion/apps-runtime";
import { useFileUpload } from "@robomotion/apps-runtime/react";

// src/components/progress.tsx
import { Fragment as Fragment8, jsx as jsx40, jsxs as jsxs38 } from "react/jsx-runtime";
function Progress({ value, label, showValue = false, className, ...props }) {
  const determinate = typeof value === "number" && Number.isFinite(value);
  const clamped = determinate ? Math.min(100, Math.max(0, value)) : 0;
  return /* @__PURE__ */ jsxs38("div", { className: cn("w-full", className), ...props, children: [
    (label || showValue && determinate) && /* @__PURE__ */ jsxs38("div", { className: "mb-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400", children: [
      /* @__PURE__ */ jsx40("span", { children: label }),
      showValue && determinate && /* @__PURE__ */ jsxs38("span", { children: [
        Math.round(clamped),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsx40(
      "div",
      {
        role: "progressbar",
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": determinate ? Math.round(clamped) : void 0,
        className: "h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800",
        children: determinate ? /* @__PURE__ */ jsx40(
          "div",
          {
            className: "h-full rounded-full bg-[color:var(--rm-accent)] transition-[width] duration-300",
            style: { width: `${clamped}%` }
          }
        ) : /* @__PURE__ */ jsxs38(Fragment8, { children: [
          /* @__PURE__ */ jsx40("style", { children: `@keyframes rm-indeterminate{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}` }),
          /* @__PURE__ */ jsx40(
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
import { jsx as jsx41, jsxs as jsxs39 } from "react/jsx-runtime";
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
  const inputRef = useRef13(null);
  const zoneRef = useRef13(null);
  const [dragOver, setDragOver] = useState23(false);
  const [uploaded, setUploaded] = useState23(null);
  const onErrorRef = useRef13(onError);
  onErrorRef.current = onError;
  useEffect14(() => {
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
  return /* @__PURE__ */ jsxs39("div", { className: cn("text-left", className), children: [
    /* @__PURE__ */ jsx41(
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
    /* @__PURE__ */ jsxs39(
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
          /* @__PURE__ */ jsx41(
            "svg",
            {
              "aria-hidden": "true",
              className: "h-7 w-7 text-neutral-400 dark:text-neutral-500",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.5",
              children: /* @__PURE__ */ jsx41(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                }
              )
            }
          ),
          /* @__PURE__ */ jsx41("span", { className: "text-sm font-medium text-neutral-700 dark:text-neutral-300", children: label }),
          hint && /* @__PURE__ */ jsx41("span", { className: "text-xs text-neutral-500 dark:text-neutral-400", children: hint })
        ]
      }
    ),
    uploading && /* @__PURE__ */ jsx41("div", { className: "mt-3", children: /* @__PURE__ */ jsx41(Progress, { value: progress, label: "Uploading", showValue: true }) }),
    !uploading && uploaded && /* @__PURE__ */ jsxs39("p", { className: "mt-2 flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400", children: [
      /* @__PURE__ */ jsx41("svg", { "aria-hidden": "true", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsx41("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "m5 13 4 4L19 7" }) }),
      uploaded.name,
      " uploaded"
    ] }),
    !uploading && error && /* @__PURE__ */ jsx41("p", { role: "alert", className: "mt-2 text-sm font-medium text-red-600 dark:text-red-400", children: error.message })
  ] });
}

// src/components/layout.tsx
import { jsx as jsx42 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx42(
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
  return /* @__PURE__ */ jsx42(
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
  return /* @__PURE__ */ jsx42(
    "div",
    {
      className: cn(
        "grid",
        GAP2[gap],
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
import { useEffect as useEffect15, useRef as useRef14, useState as useState24 } from "react";
import { useAssistant, useMaybeAppClient as useMaybeAppClient3 } from "@robomotion/apps-runtime/react";
import { jsx as jsx43, jsxs as jsxs40 } from "react/jsx-runtime";
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
  "[&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:text-[0.9em] dark:[&_code]:bg-white/10",
  "[&_pre]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-black/5 [&_pre]:p-2 dark:[&_pre]:bg-white/10 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-1 [&_table]:text-xs [&_th]:px-1 [&_th]:py-0.5 [&_th]:text-left [&_td]:px-1 [&_td]:py-0.5 [&_th]:border-b [&_th]:border-black/10 dark:[&_th]:border-white/10",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-black/10 [&_blockquote]:pl-2 [&_blockquote]:opacity-80 dark:[&_blockquote]:border-white/20"
);
function AssistantWidget({ title = "Assistant", placeholder = "Ask the app to do something\u2026", className }) {
  const app = useMaybeAppClient3();
  if (!app) return null;
  return /* @__PURE__ */ jsx43(AssistantWidgetInner, { title, placeholder, className });
}
function AssistantWidgetInner({ title, placeholder, className }) {
  const { available, greeting, messages, busy, send } = useAssistant();
  const [open, setOpen] = useState24(() => {
    try {
      return sessionStorage.getItem(STORAGE_OPEN) === "1";
    } catch {
      return false;
    }
  });
  const [draft, setDraft] = useState24("");
  const listRef = useRef14(null);
  const inputRef = useRef14(null);
  useEffect15(() => {
    try {
      sessionStorage.setItem(STORAGE_OPEN, open ? "1" : "0");
    } catch {
    }
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect15(() => {
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
  return /* @__PURE__ */ jsxs40("div", { className: cn("fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3", className), "data-rm-assistant": "", children: [
    open && /* @__PURE__ */ jsxs40(
      "div",
      {
        role: "dialog",
        "aria-label": title,
        className: "flex h-[min(32rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white text-left shadow-2xl dark:border-white/10 dark:bg-neutral-900",
        children: [
          /* @__PURE__ */ jsxs40("header", { className: "flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10", children: [
            /* @__PURE__ */ jsxs40("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx43("span", { className: "inline-block h-2.5 w-2.5 rounded-full bg-[color:var(--rm-accent)]", "aria-hidden": "true" }),
              /* @__PURE__ */ jsx43("span", { className: "text-sm font-semibold", children: title })
            ] }),
            /* @__PURE__ */ jsx43(
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
          /* @__PURE__ */ jsxs40("div", { ref: listRef, className: "flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm", children: [
            messages.length === 0 && /* @__PURE__ */ jsx43("p", { className: "text-neutral-500", children: greeting || "Tell me what you want done in this app and I will do it." }),
            messages.map((m) => /* @__PURE__ */ jsx43("div", { className: cn("flex", m.role === "user" ? "justify-end" : "justify-start"), children: /* @__PURE__ */ jsxs40(
              "div",
              {
                className: cn(
                  "max-w-[85%] rounded-2xl px-3 py-2",
                  m.role === "user" ? "whitespace-pre-wrap rounded-br-md bg-[color:var(--rm-accent)] text-white" : cn("rounded-bl-md bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100", assistantProse)
                ),
                children: [
                  m.tools && m.tools.length > 0 && /* @__PURE__ */ jsx43("div", { className: "mb-1 text-[11px] opacity-70", children: didLine(m.tools) }),
                  m.role === "user" ? m.text : m.text ? /* @__PURE__ */ jsx43(Xa, { mode: "streaming", isAnimating: !!m.streaming, children: m.text }) : m.streaming ? /* @__PURE__ */ jsx43("span", { className: "animate-pulse", children: "\u2026" }) : null,
                  m.error && /* @__PURE__ */ jsx43("div", { className: "mt-1 text-[12px] text-red-600 dark:text-red-400", children: m.error })
                ]
              }
            ) }, m.id))
          ] }),
          /* @__PURE__ */ jsx43("form", { onSubmit: submit, className: "border-t border-black/5 p-3 dark:border-white/10", children: /* @__PURE__ */ jsxs40("div", { className: "flex items-end gap-2", children: [
            /* @__PURE__ */ jsx43(
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
            /* @__PURE__ */ jsx43(
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
    /* @__PURE__ */ jsxs40(
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
          /* @__PURE__ */ jsx43("span", { "aria-hidden": "true", children: "\u2726" }),
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
  AppShell,
  AssistantWidget,
  Avatar,
  AvatarGroup,
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
  Dialog,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  FieldArray,
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
  Message,
  NumberInput,
  Popover,
  Progress,
  RadioGroup,
  Rating,
  Row,
  Screen,
  Select,
  Skeleton,
  Slider,
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
  Thread,
  TimePicker,
  Timeline,
  TimelineItem,
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