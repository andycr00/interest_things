// This code concat attributes of an object in typescript and finish with his value

export default function concatObject(
    obj: { [k: string]: any },
    prefix: string = ""
  ) {
    let concat = "";
    for (let key in obj) {
      if (typeof obj[key] === "object") {
        concat += concatObject(obj[key], prefix + key + ".");
      } else {
        concat += prefix + key + ": " + obj[key] + "; ";
      }
    }
    return concat;
  }
  