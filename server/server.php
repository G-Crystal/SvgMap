<?php
	$file = "../js/json/map.json";
	$str=file_get_contents($file);

	$data = utf8_encode($str); 
	$data = json_decode($data, true);
	$newJson = json_decode(utf8_encode($_POST['json']), true);

	if ($_POST['deleted'] == "false") {
		array_push($data, $newJson);
	}
	else {
		foreach ($data as $key => $entry) {
			// if ($newJson["coordinates"][0] == $entry['coordinates'][0] && $newJson["coordinates"][1] == $entry['coordinates'][1]) {
			if ($newJson["uid"] == $entry['uid']) {
				unset($data[$key]);
			}
		}
	}
	$last = utf8_encode(json_encode(array_values($data)));
	echo json_last_error();
	if ($data !== null && substr_count($last, '}]') < 2 && json_last_error() === JSON_ERROR_NONE) {
		file_put_contents($file, $last, LOCK_EX);
	}
?>