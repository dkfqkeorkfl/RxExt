const REQUEST = require('request')
const CSV = require('csvtojson')
const RX = require('rx');
const RSA = require('node-rsa');
const WS_SERVER = require('websocket').server;

function Following(observer, func, argcs) {
    if (argcs.length == 0) {
        observer.onCompleted();
        return;
    }

    const argc = argcs.shift();
    func(argc)
        .subscribe(
            data => observer.onNext(data),
            err => observer.onError(err),
            _ => argcs.length == 0 ? observer.onCompleted() : Following(observer, func, argcs)
        )
}

const ex = {

    IntervalToObsv(ms) {
        return RX.Observable.create(observer => {
            const iserial = setInterval(() => {
                observer.onNext(true);
            }, ms);

            return new RX.Disposable(() => {
                clearInterval(iserial);
            })
        })
    },
    TimeoutToObsv(ms) {
        return RX.Observable.create(observer => {
            const tserial = setTimeout(() => {
                observer.onNext(true);
                observer.onCompleted();
            }, ms);

            return new RX.Disposable(() => {
                clearTimeout(tserial);
            })
        })
    },
    ImmediateToObsv() {
        return RX.Observable.create(observer => {
            const iserial = setImmediate(() => {
                observer.onNext(true);
                observer.onCompleted();
            });

            return new RX.Disposable(() => {
                clearImmediate(iserial);
            })
        })
    },

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

    StreamToObsv: function(stream) {
        return RX.Observable.create(obj => {
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

    FollowingToObsv(argcs, func) {
        return RX.Observable.create(observer => {
            Following(observer, func, argcs);
        });
    },

    WSListen(config) {
        return RX.Observable.range(0, 1)
            .select(_ => new WS_SERVER(config))
            .selectMany(ws => {
                return RX.Observable.create(observer => {
                    ws.on('request', req => {
                            if (!config.autoAcceptConnections)
                                observer.onNext(req);
                        })
                        .on('connect', conn => {
                            if (config.autoAcceptConnections)
                                observer.onNext(conn)
                        })

                    return new RX.Disposable(() => {
                        ws.shutDown();
                        ws.removeAllListeners();
                    })
                })
            });
    },

    WSRecv(connection) {
        return RX.Observable.create(observer => {
            const onRecv = data => observer.onNext(data);
            const onDisconn = () => observer.onCompleted();
            const onError = err => observer.onError(err);
            connection
                .on('message', onRecv)
                .on('close', onDisconn)
                .on('error', onError)

            return new RX.Disposable(() => {
                if (connection.connected)
                    connection.close();
                connection
                    .removeListener('message', onRecv)
                    .removeListener('close', onDisconn)
                    .removeListener('error', onError);
            })
        });
    },

    CollectionDateObs(start, end, interval) {
        const size = (end.valueOf() - start.valueOf()) / interval;
        return RX.Observable.range(0, size)
            .map(i => start.valueOf() + (interval * i))
            .map(v => new Date(v));
    }
}

module.exports = Object.assign(RX, ex);