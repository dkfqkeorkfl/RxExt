const rx = require('./SasRx');

//86400000
rx.CollectionDateObs(new Date('2019-01-01'), new Date('2019-01-02'), 86400000/4)
    .subscribe(
        date => console.log(date),
        err => console.log(err),
        _ => console.log('complete')
    );

rx.Observable.range(0, 100)
    .toArray()
    .flatMap(datas => {
        return rx.FollowingAsObserverable(datas, data => {
            return rx.Observable.range(0, 1)
                .flatMap(_ => {
                    console.log(data);
                    return [1];
                });
        })
    })
    .toArray()
    .flatMap(rets => {
        return rx.DownloadSheet("https://docs.google.com/spreadsheets/d/1IsIjwQNKjSGehrw86Z6gaesMvgTQUrSFROcuCp0rIIs/export?format=csv")
    })
    .subscribe(
        row => console.log(row),
        err => console.log(err),
        _ => console.log("complete"));