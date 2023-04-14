# summary

連番の csv ファイルを読み込み、insert/update/delete 操作を行います。

# description

ファイル名のフォーマットは次の通りです。  
    `[連番]_[アクション]_[オブジェクト名].csv`  
連番は 1 からの連番で、欠番すると終了します。  
アクションには `insert`, `update`, `delete` が指定できます。

CSV の1行目は項目名を意味し、参照項目には末尾に`(ref)`を指定します。

```csv
Id,Name,xxx_Item__c(ref)
xxxxxxxxxxxxxxxxxx,Test,yyyyyyyyyyyyyyyyyy
```

尚、Id 列は行を識別するための項目です。  
`update`, `delete` または参照項目の値で参照します。

# flags.user.summary

Salesforce 組織のユーザ名を指定します。

# flags.directory.summary

CSV 

# examples

- <%= config.bin %> <%= command.id %> -u user_id@example.com -d directory_name

