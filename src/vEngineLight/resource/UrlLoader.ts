
export class UrlLoader {
    public static addUrlParameter(url:string,param:string,value:string|number){
        if (url.indexOf('?')>-1) url+='&';
        else url+='?';
        return `${url}${param}=${value}`;
    }

    public load <T>(url:string,responseType: XMLHttpRequestResponseType,onProgress?:(n:number)=>void) {

        const xhr = new XMLHttpRequest();
        xhr.open('GET',UrlLoader.addUrlParameter(url,'BUILD_ID',BUILD_ID), true);
        xhr.responseType = responseType;

        if (xhr.responseType==='blob') {
            xhr.setRequestHeader('Accept-Ranges', 'bytes');
            xhr.setRequestHeader('Content-Range', 'bytes');
        }

        // if (urlRequest.headers) {
        //     for (const header of urlRequest.headers) xhr.setRequestHeader(header.name,header.value);
        // }

        return new Promise<T>((resolve,reject)=>{
            xhr.onload = ()=> {
                if (xhr.readyState === 4) {
                    if(xhr.status === 200) {
                        resolve(xhr.response);
                    }
                    else {
                        reject(url);
                    }
                }
            };
            if (onProgress) {
                xhr.onprogress = (e:ProgressEvent)=>{
                    if (e.total!==0) onProgress(e.loaded / e.total);
                };
            }

            xhr.onerror=(e:Event)=> {
                console.error(e);
                reject(url);
            };

            xhr.ontimeout=(e)=> {
                console.error(e);
                reject(url);
            };

            xhr.send();
        });
    };

}
