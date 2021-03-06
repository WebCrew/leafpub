<?php

namespace Leafpub;

use Leafpub\Importer\ImportFactory;

class Importer extends Leafpub {

    public static function doImport($options) {
        // Read params
        $dropin = $options['importer'];
        $file = $options['file'];
        // 1. Set site in maintenance mode
        Setting::update('maintenance', 'on');
        // 2. ini_set
        $old_execution_time = ini_get('max_execution_time');
        ini_set('max_execution_time', '600');        
        // 5. Parse file and import data
        $importer = ImportFactory::factory($dropin, $file);
        $importer->setOptions($options);
        $importer->parseFile();
        $ret = $importer->importData();
        // 8. unlink $file
        unlink($file);
        // 9. Set maintenance mode off
        ini_set('max_execution_time', $old_execution_time);
        Setting::update('maintenance', 'off');
        return $ret;
    }
}