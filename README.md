# RxExt

//86400000
     RX.CollectionDateObs(new Date('2019-01-01'), new Date('2019-01-02'), 86400000/4)
         .subscribe(
             date => console.log(date),
             err => console.log(err),
             _ => console.log('complete')
         );

     // FollowingAsObserverable
    RX.Observable.range(0, 100)
        .toArray()
        .selectMany(datas => {
            return RX.FollowingAsObserverable(datas, data => {
                return RX.Observable.range(0, 1).select(_ => data)
            })

        })
        .subscribe(data => {
            // wait and ordering
            console.log(data);
        });

    // DecryptRsaKey
    RX.Observable.range(0, 1)
        .selectMany(_ => {
            return RX.DecryptRsaKey("encryted data", "key");
        })
        .subscribe(plain => {
            console.log(plain);
        })

    // DownloadSheet
    RX.Observable.fromArray(Object.keys(CONFIG.sheet))
        .flatMap(key => {
            const config = CONFIG.sheet[key];
            const local = { datas: [] };
            return RX.DownloadSheet(config.url)
                .toArray()
                .map(datas => {
                    let ret = {};
                    Object.keys(config.idx).forEach(i => {
                        const f = config.idx[i];
                        datas.forEach(data => {
                            ret[i + "_" + f(data)] = data;
                        })
                    });

                    return ret;
                })
        })
        .toArray()
        .map(items => {
            return Object.assign({}, ...items);
        })
        .subscribe(
            data => console.log(cached),
            err => console.log(err),
            _ => console.log('complete')
        );
