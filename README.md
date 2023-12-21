# azalea-works

### CLA

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.

### Build

To build the plugin locally, make sure to have yarn installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:salesforcecli/azalea-works

# Install the dependencies and compile
yarn && yarn build
```

To use your plugin, run using the local `./bin/dev` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev azalea data apply --help
****```

There should be no differences when running via the Salesforce CLI or using the local run file. However, it can be useful to link the plugin to do some additional testing or run your commands from anywhere on your machine.

```bash
# Link your plugin to the sf cli
sf plugins link .
# To verify
sf plugins
```

## Commands

<!-- commands -->

- [`sf azalea data apply`](#sf-hello-world)

## `sf azalea data apply`

連番の csv ファイルを読み込み、insert/update/delete 操作を行います。

USAGE
  $ sf azalea data apply -u <value> [--json] [-d <value>]

FLAGS
  -d, --data-folder=<value>  [default: data] CSV
  -s, --transactsize=<value> [default: 20] 1回のDMLの最大実行サイズを指定します。デフォルトは 20 です。
  -u, --user=<value>         (required) Salesforce 組織のユーザ名を指定します。

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  連番の csv ファイルを読み込み、insert/update/delete 操作を行います。

  ファイル名のフォーマットは次の通りです。
  `[連番]_[アクション]_[オブジェクト名].csv`
  連番は 1 からの連番で、欠番すると終了します。
  アクションには `insert`, `update`, `delete` が指定できます。

  CSV の1行目は項目名を意味します。
  書式は `[項目API名]([型])` の書式です。`[型]` は Id 項目だけ指定不要です（むしろプライマリキーになるので、指定しないでください）。
  `型` は以下のものが指定できます。

- `ref`(参照、主従関係等Id参照)
- `bool`(チェックボックス)
- `num`(数値、金額等)
- `per`(パーセント)
- `date`(日付。`yyyy-MM-dd`書式)
- `time`(時刻型。`HH:mm:ss.sssZ`書式)
- `datetime`(日時型。`yyyy-MM-ddTHH:mm(timezone)` 書式で、例えば日本時間の23/4/16 午前9時なら `2023-04-16T09:00+09:00`)

  Example:

  ```csv
  Id,Name(text),xxx_Item__c(ref)
  xxxxxxxxxxxxxxxxxx,Test,yyyyyyyyyyyyyyyyyy
  ```

  尚、Id 列は行を識別するための項目です。
  `update`, `delete` または参照項目の値で参照します。

EXAMPLES
  $ sf azalea data apply -u user_id@example.com -d directory_name -s 1

<!-- commandsstop -->
