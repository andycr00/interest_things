// Calculates values, based on any data structure. It uses an attribute with the $ simbol to know 
// whats the value to calculate

/**
 * It is an example object
 * {
  "event": {
    "event": {
      "sensor[2]": {
        "temp[1]": {
          "enable": "ON",
          "name": "Temperature",
          "value$": {
            "compute": {
              "strategy": "double",
              "threshold": 0.5,
              "scale": "0.5|1|-1"
            },
            "initial": 130,
            "limit": 5,
            "domain": "[100,150]"
          },
          "valuestring": "${value} F"
        },
        "cc[all]": {
          "group": "Contact Closures",
          "valueclass$": {
            "compute": {
              "strategy": "option",
              "threshold": 0.5
            },
            "initial": "Normal",
            "domain": [
              "Normals",
              "Info",
              "Major"
            ]
          }
        },
        "cc[1]": {
          "group": "Contact Closures",
          "valueclass$": {
            "compute": {
              "strategy": "option",
              "threshold": 0.5
            },
            "initial": "Major",
            "domain": [
              "Normal",
              "Info",
              "Major"
            ]
          }
        }
      },
      "sensor[3]": {
        "temp[1]": {
          "enable": "ON",
          "name": "Temperature",
          "value$": {
            "compute": {
              "strategy": "double",
              "threshold": 0.5,
              "scale": "0.5|1|-1"
            },
            "initial": 100,
            "limit": 5,
            "domain": "[100,150]"
          },
          "valuestring": "${value} F"
        },
        "cc[all]": {
          "group": "Contact Closures",
          "valueclass$": {
            "compute": {
              "strategy": "option",
              "threshold": 0.5
            },
            "initial": "Normal",
            "domain": [
              "Normals",
              "Info",
              "Major"
            ]
          }
        },
        "cc[1]": {
          "group": "Contact Closures",
          "valueclass$": {
            "compute": {
              "strategy": "option",
              "threshold": 0.5
            },
            "initial": "Major",
            "domain": [
              "Normal",
              "Info",
              "Major"
            ]
          }
        }
      },
      "sensor[all]": {
        "temp[1]": {
          "enable": "ON",
          "name": "Temperature",
          "value$": {
            "compute": {
              "strategy": "double",
              "threshold": 0.5,
              "scale": "0.5|1|-1"
            },
            "initial": 120,
            "limit": 5,
            "domain": "[100,150]"
          },
          "valuestring": "${value} F"
        },
        "cc[all]": {
          "group": "Contact Closures",
          "valueclass$": {
            "compute": {
              "strategy": "option",
              "threshold": 0.5
            },
            "initial": "Normal",
            "domain": [
              "Normals",
              "Info",
              "Major"
            ]
          }
        },
        "cc[1]": {
          "group": "Contact Closures",
          "valueclass$": {
            "compute": {
              "strategy": "option",
              "threshold": 0.5
            },
            "initial": "Major",
            "domain": [
              "Normal",
              "Info",
              "Major"
            ]
          }
        }
      }
    }
  }
}
 */
export default function computeValue(
    obj: {
      [k: string]: any;
    },
    actualEvent: { [k: string]: any } | null
  ) {
    for (let key in obj) {
      if (typeof obj[key] !== "object") return {};
      const calc = Object.keys(obj[key]).find((val) => val.includes("$"));
  
      if (!calc) {
        computeValue(obj[key], actualEvent);
        continue;
      }
  
      const calcWithoutSimbol = calc.replace("$", "");
      const rand = Math.random();
      const calculate = obj[key][calc];
      const value = Object.keys(obj[key])
        .find((val) => new RegExp(calcWithoutSimbol + "[A-Za-z0-9]+").test(val))
        ?.replace("$", "");
  
      const state = actualEvent
        ? paramFinder(actualEvent, key, calcWithoutSimbol)
        : calculate.initial;
      try {
        const result =
          calculate.compute.strategy == "option"
            ? option(calculate.domain, rand)
            : numberStrategy(calculate, state, rand);
  
        obj[key][calcWithoutSimbol] = result;
  
        delete obj[key][calc];
        if (value)
          obj[key][value] = obj[key][value].replace(calcWithoutSimbol, result);
      } catch (error) {
        console.log({ ERROR: error });
      }
    }
    return obj;
  }
  
  const option = (domain: any[], random: number) => {
    return domain[Math.floor(random * domain.length)];
  };
  
  const numberStrategy = (
    calculate: { [k: string]: any },
    initial: number,
    random: number
  ) => {
    const domain = JSON.parse(calculate.domain);
    const scaleValues = calculate.compute.scale.split("|");
    const scale = random <= scaleValues[0] ? scaleValues[1] : scaleValues[2];
    const value =
      Number(initial) + random * (calculate.limit || 1) * Number(scale);
  
  
    if (value <= domain[0]) return domain[0];
    if (value > domain[1]) return domain[1];
  
    return value.toFixed(2);
  };
  
  const paramFinder = (
    obj: { [k: string]: any },
    name: string,
    param: string
  ): any => {
    if (typeof obj !== "object") return {};
    for (let key in obj) {
      if (Object.keys(obj).includes(name)) {
        return obj[name][param];
      }
      return paramFinder(obj[key], name, param);
    }
  };
  