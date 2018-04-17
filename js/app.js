(function() {
    var flagConsole = false,
        flagDigital = false,
        battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery,
        interval;
    
    var el_player = document.getElementById("player"),
    		el_enemy = document.getElementById("enemy"),
    		el_effect = document.getElementById("effect");
    
    var is_attacking = 0;
    
    var enemies = [{
    		"class": "skeleton",
    		"health": 250
    },{
		"class": "lutin",
		"health": 350
    }];
    
    var enemy_max_health, enemy_health;
    chooseEnemy();
    
    var total_step = 0, previous_step = 0; 
    
    var debug = document.getElementById("debug");
    
    document.getElementById("map").onmousedown = function() {
    		start_attack(500);
    }
    
    var start_attack = function(damage) {
    		if (enemy_health <= 0) {
    			return false;
    		}
    		if (is_attacking == 1) {
    			return false;
    		}
    		is_attacking = 1;
    		
        console.log("User moused down");
        el_player.className += " animate";
        
        var player_sprite = el_player.getElementsByClassName("sprite")[0];
        
        var end_effect_function = function() {
        		console.log("end_effect_function");
            el_effect.removeEventListener("webkitAnimationEnd", end_effect_function);
        		el_effect.style.display = "none";
        		el_effect.className = "";
        		
        		el_player.className += " back";        		
        		el_player.addEventListener("webkitAnimationEnd", end_battle_function);
        		
        		console.log(enemy_health + " VS " + damage);
        		enemy_health = Math.max(0, enemy_health - damage);
        	    update_health_bar("enemy", enemy_health, enemy_max_health);
        	    
        	    if (enemy_health <= 0) {
        	    		el_enemy.className += " dead";
        	    }
        };
        
        var battle_function = function() {
        		console.log("battle_function");
            player_sprite.removeEventListener("webkitAnimationEnd", battle_function);
	    		
	    		el_effect.style.display = "block";
	    		el_effect.className += "animate";
    		
            el_effect.addEventListener("webkitAnimationEnd", end_effect_function);
        };
        
        var end_battle_function = function() {
        		console.log("end_battle_function");
    			el_player.removeEventListener("webkitAnimationEnd", end_battle_function);
    			
    			el_player.className = "unit";
    			
    			is_attacking = 0;
    			
    			console.log("All done!");
        };
        
        player_sprite.addEventListener("webkitAnimationEnd", battle_function);
        
        return true; // Not needed, as long as you don't return false
    };
    
    function onPedometerDataSuccess(pedometerInfo) {

        
        var d = pedometerInfo.stepCountDifferences[0];
        //console.log("stepCountDifference:"+ d.stepCountDifference);
        
        previous_step = pedometerInfo.cumulativeTotalStepCount - previous_step;
        if (previous_step > 1) {
        		start_attack(previous_step);
        }
        
        debug.innerHTML = pedometerInfo.cumulativeTotalStepCount + "/" + previous_step;
        total_step = pedometerInfo.cumulativeTotalStepCount;
        previous_step = total_step;
    }

    function onPedometerDataError(error) {
        console.log("Error occurs. name:"+error.name + ", message: "+error.message);
    }

    function onPedometerStarted(pedometerdata) {
        //console.log("From now on, you will be notified when the pedometer data changes.");
        // To get the current data information
        tizen.humanactivitymonitor.getHumanActivityData("PEDOMETER", onPedometerDataSuccess, onPedometerDataError);
    }
    tizen.humanactivitymonitor.start("PEDOMETER", onPedometerStarted);
 
    function update_health_bar(element_id, value, max) {
        document.getElementById(element_id).getElementsByClassName("fill")[0].style.width = Math.floor((value / max) * 100) + "%";
    }
    
    function chooseEnemy() {
    		var rand = Math.floor((Math.random() * enemies.length));
    		var data = enemies[rand];
    		
    		el_enemy.className = "unit " + data.class;
    		enemy_health = data.health;
    		enemy_max_health = data.health;
    		
    	    update_health_bar("enemy", enemy_health, enemy_max_health);
    }

    /**
     * Updates the current time.
     * @private
     */
    function updateTime() {
        var strHours = document.getElementById("str-hours"),
            strConsole = document.getElementById("str-console"),
            strMinutes = document.getElementById("str-minutes"),
            datetime = tizen.time.getCurrentDateTime(),
            hour = datetime.getHours(),
            minute = datetime.getMinutes();

        strHours.innerHTML = (hour < 10 ? "0" : "") + hour;
        strMinutes.innerHTML = (minute < 10 ? "0" : "") + minute;


        // Each 0.5 second the visibility of flagConsole is changed.
        if(flagDigital) {
            if (flagConsole) {
                strConsole.style.visibility = "visible";
                flagConsole = false;
            } else {
                strConsole.style.visibility = "hidden";
                flagConsole = true;
            }
        }
        else {
            strConsole.style.visibility = "visible";
            flagConsole = false;
        }
    }
    
    function updateScreen() {
        updateTime();
    }
    
    function updateBattery() {
    		update_health_bar("player", battery.level, 1);
    }

    function setModeDigital() {
        flagDigital = true;
        interval = setInterval(updateTime, 500);
    }

    function setModeAmbient() {
        flagDigital = false;
        clearInterval(interval);
        document.getElementById("digital-body").style.backgroundImage = "none";
        updateTime();
    }



    /**
     * Updates watch screen. (time and date)
     * @private
     */


    /**
     * Binds events.
     * @private
     */
    function bindEvents() {

    		// Battery events
    		battery.addEventListener("chargingchange", updateBattery);
        battery.addEventListener("chargingtimechange", updateBattery);
        battery.addEventListener("dischargingtimechange", updateBattery);
        battery.addEventListener("levelchange", updateBattery);

        // Ambient mode - Timetick (Called once every minutes)
        window.addEventListener("timetick", function() {
        		setModeAmbient();
        });

        // Ambient mode - Changed
        window.addEventListener("ambientmodechanged", function(event) {
            if (event.detail.ambientMode === true) {
            		setModeAmbient();
            } else {
            		setModeDigital();
            }
        });

        // Refresh the screen when the device wake up
        document.addEventListener("visibilitychange", function() {
        		// If the enemy is dead, pick a new one
	    		if (enemy_health <= 0) {
	    			chooseEnemy();
	    		}
	    		
            if (!document.hidden) {
            		updateScreen();
            }
        });

        // Refresh the screen when the time zone is changed
        tizen.time.setTimezoneChangeListener(function() {
        		updateScreen();
        });
    }


    window.onload = function() {
    		setModeDigital();
    		
        updateBattery();

        bindEvents();
    };
}());
