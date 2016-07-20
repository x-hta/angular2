import { Injectable }    from '@angular/core';

@Injectable()
export class LocalStorageService {

    private static getAppId() : string{
        return "123"; //$("input[name=appid]").val();
    }

    private static getUserId() : string{
        return "hta"; //$("input[name=author]").val();
    }

    getData(id : string) : any{
        let obj;
        if(id !== undefined && id !== null){
            let key = LocalStorageService.getAppId() + "-" + LocalStorageService.getUserId() + "-" + id;
            let storedObj = localStorage.getItem(key);
            if(storedObj){
                obj = JSON.parse(storedObj);
            }
        }
        return obj;
    }

    save(id : string, object : any) : boolean{
        var success = false;
        if (id !== undefined && id !== null && object && JSON.stringify(object) !== "{}") {
            let key = LocalStorageService.getAppId() + "-" + LocalStorageService.getUserId() + "-" + id;
            localStorage.setItem(key, JSON.stringify(object));
            success = true;
        }
        return success;
    }

    remove(id : string) : boolean{
        if(id !== undefined && id !== null){
            let key = LocalStorageService.getAppId() + "-" + LocalStorageService.getUserId() + "-" + id;
            localStorage.removeItem(key);
            return true;
        }
        return false;
    }

    removeAll (keyPrefix : string) : boolean{
        keyPrefix = LocalStorageService.getAppId() + "-" + LocalStorageService.getUserId() + "-" + keyPrefix;
        for (var i = localStorage.length - 1; i >= 0; i--) {
            var key = localStorage.key(i);
            if (key.indexOf(keyPrefix) === 0) {
                localStorage.removeItem(key);
            }
        }
        return true;
    }
}
