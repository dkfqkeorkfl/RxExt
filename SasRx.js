const REQUEST = require('request')
const CSV = require('csvtojson')
const RX = require('rx');
const RSA = require('node-rsa');

function Following(observer, func, argcs) {
    const argc = argcs.shift();
    func(argc)
        .subscribe(
            data => observer.onNext(data),
            err => observer.onError(err),
            _ => argcs.length == 0 ? observer.onCompleted() : Following(observer, func, argcs)
        )
}

const ex = {
    DownloadSheet(url) {
        return RX.Observable.create(observer => {
            CSV()
                .fromStream(REQUEST.get(url))
                .subscribe(
                    json => observer.onNext(json),
                    err => observer.onError(err),
                    _ => observer.onCompleted()
                )
        });
    },

    DecryptRsaKey(test, key) {

        return RX.Observable.fromPromise(new Promise((resolve, reject) => {
            let rsa = new RSA();
            rsa.importKey(key, 'pkcs1-private-pem');
            const ret = rsa.decrypt(test, 'utf8');
            resolve(ret);
        }));
    },

    StreamToObserable: function(stream) {
        return rx.Observable.create(obj => {
            stream
                .on('error', (err) => {
                    obj.error(err);
                })
                .on('end', (data) => {
                    obj.complete();
                })
                .on('data', (data) => {
                    obj.next(data);
                });
        });
    },

    FollowingAsObserverable(argcs, func) {
        return RX.Observable.create(observer => {
            Following(observer, func, argcs);
        });
    }
}

module.exports = Object.assign(RX, ex);