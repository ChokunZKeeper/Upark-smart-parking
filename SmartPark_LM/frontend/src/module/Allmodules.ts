import type React from "react";

function formInput (from:string, page:string, children:React.ReactNode){
  return (from === page && children)
}

async function sendRequest(host: string,route: string,method: string,mimme_type: string = "application/json", payload: object | null = null,) {
  try {
    const res = await fetch(`http://localhost:${host}/${route}`, {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": mimme_type.toLowerCase(),
      },
      body: (payload !== null)? JSON.stringify(payload) : null,
    });

    if (!res.ok) {
      if(res.status === 404){
        console.log(`Not Found: ${route}`);
        return null;
      }
      console.error(`HTTP Error: ${res.status}`);
      return null;
    }

    return await res.json();
    
  } catch (err) {
    console.log("cannot connet Server: ", err);
  }
}

export default { sendRequest, formInput};
