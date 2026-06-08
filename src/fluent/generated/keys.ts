import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '57b4d0cd810a4530a2093343cba0a493'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'f844bf071fc044908463eaa87cd9e5b3'
                    }
                    prop_ai_api_key: {
                        table: 'sys_properties'
                        id: '8c9bf3d8b71b4e5496273a6df0ec87cc'
                    }
                    prop_ai_model: {
                        table: 'sys_properties'
                        id: 'de2cdec655f84643a36b0ada298c9ea6'
                    }
                    prop_notification_recipients: {
                        table: 'sys_properties'
                        id: '9b7cabca2e5e42b895f28f6f31bc9de2'
                    }
                    prop_scan_batch_size: {
                        table: 'sys_properties'
                        id: '377e50557bba4cd4bfdd866a0ccc59af'
                    }
                    prop_scoring_deduction_critical: {
                        table: 'sys_properties'
                        id: 'dc984c3da82f4b2f8d9993d349a5282d'
                    }
                    prop_scoring_deduction_high: {
                        table: 'sys_properties'
                        id: '565fa28dfebd4bb1a333758f21612d8a'
                    }
                    prop_scoring_deduction_low: {
                        table: 'sys_properties'
                        id: '5cbfa1e0aaea461b920091810df664d1'
                    }
                    prop_scoring_deduction_medium: {
                        table: 'sys_properties'
                        id: 'a26105c125244413a2f792af39f88552'
                    }
                    prop_scoring_threshold_attention: {
                        table: 'sys_properties'
                        id: '20d44dfdcb5346598a3e986f3bea6ebd'
                    }
                    prop_scoring_threshold_healthy: {
                        table: 'sys_properties'
                        id: '9159adaa6e0747519d76ce323fdba66d'
                    }
                    prop_scoring_threshold_risk: {
                        table: 'sys_properties'
                        id: 'b4aa8d140ee9435cb5317e2559cab318'
                    }
                    prop_scoring_weight_catalog: {
                        table: 'sys_properties'
                        id: '2de97e2af6c24f6c9789039f9612b3d5'
                    }
                    prop_scoring_weight_cmdb: {
                        table: 'sys_properties'
                        id: '90d98584ff664d7eb6eef62b8b06d54a'
                    }
                    prop_scoring_weight_integration: {
                        table: 'sys_properties'
                        id: '2990bed63e9c43a191837f828a98d81e'
                    }
                    prop_scoring_weight_performance: {
                        table: 'sys_properties'
                        id: '44d69360754f407390cc5a12a1eb3ff7'
                    }
                    prop_scoring_weight_security: {
                        table: 'sys_properties'
                        id: '3be93ea5277c4ddcba8a85570ba7c3f4'
                    }
                    rest_msg_fn_gov_copilot_send_findings: {
                        table: 'sys_rest_message_fn'
                        id: 'c8e2e61f711148e7ac8b931e1af2b546'
                    }
                    rest_msg_gov_copilot_claude_api: {
                        table: 'sys_rest_message'
                        id: '8d4a3a1cdd31446eacf455dc61ac5818'
                    }
                    script_include_gov_copilot_ai_engine: {
                        table: 'sys_script_include'
                        id: '47f03f2a31234ec0b1f98121c44bde87'
                    }
                    script_include_gov_copilot_catalog_module: {
                        table: 'sys_script_include'
                        id: '9f0e1fb0c8524e65a2d216a4c7b995e3'
                    }
                    script_include_gov_copilot_cmdb_module: {
                        table: 'sys_script_include'
                        id: '7c25f051881d48848b5d622ef6e6dcc3'
                    }
                    script_include_gov_copilot_integration_module: {
                        table: 'sys_script_include'
                        id: '211fb5fd289f4138bab4de76e17f489d'
                    }
                    script_include_gov_copilot_notification_service: {
                        table: 'sys_script_include'
                        id: '88a9fd7a3e3c46de931c02f26d2758d2'
                    }
                    script_include_gov_copilot_performance_module: {
                        table: 'sys_script_include'
                        id: 'dab7aa9a39674da6a02797048730b12b'
                    }
                    script_include_gov_copilot_progress_worker: {
                        table: 'sys_script_include'
                        id: 'bb8047875b5e4ce39d3ce66cb31cba27'
                    }
                    script_include_gov_copilot_scan_endpoint: {
                        table: 'sys_script_include'
                        id: '92b9db1f2f474f42bc0558120d22fc1b'
                    }
                    script_include_gov_copilot_scan_orchestrator: {
                        table: 'sys_script_include'
                        id: 'd12dee43f1b7432c97e6db00dceb2846'
                    }
                    script_include_gov_copilot_scoring_engine: {
                        table: 'sys_script_include'
                        id: 'dd6620b49c7b4bb39b71a4dba83e3333'
                    }
                    script_include_gov_copilot_security_module: {
                        table: 'sys_script_include'
                        id: '715b5948dcd149229c67f2f4c60feff6'
                    }
                    ui_action_run_scan_now: {
                        table: 'sys_ui_action'
                        id: '5ab5f12ecb814274bbfe7b598ee0c6d5'
                    }
                }
                composite: [
                    {
                        table: 'sys_documentation'
                        id: '012ac8fd3e914e15bfae18312d6edff5'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_finding_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '029870d675ec4c10b7ac2cf3418009d4'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_modules_failed'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '033777aa37874610a92b7459b6d9ef3e'
                        key: {
                            name: 'x_gov_copilot_finding'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '03aab7608cd54cd7ab8dda6edb2fa20f'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '0472098803bc4cbeb741216268014739'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_scan_type'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '063f43f6f4b34de8b2b8edcd3b2aa1c1'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_generated_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '0f67604a81fd4e98b618d267928cc425'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_severity_confirmed'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '11717ca0a70d4fe59b0041a4378f090e'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_previous_score'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '11c32a067e324685a11232c51755ded0'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_started_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '132f6f14e7234a14b432194a1b4770d6'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_total_findings'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '14385b6ec42e43e78ea877413928af13'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '19116f5f6610479c9ac22f17afb214e1'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_duration_seconds'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '19406db8578e427a9bcac7b93a80fedd'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_status'
                            value: 'completed'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1a38d1aca7dc49a58569ae9729ed5c6c'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_estimated_effort'
                            value: 'hours'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1b3830ef80d34af9b5b3fb5cdbe41f04'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_total_findings'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1c8d2044ad0440c3bc028a0f4db23c47'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_status'
                            value: 'failed'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1c8ea29a25244a25ac9487937e71ee58'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_finding_count'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1de89210d2504911ad2173c43501c44a'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_ai_model_used'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1dfab4c6f96a4d4f9a6e8d39beb97782'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_scan_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '22f48be692c942d79f83a2db50591178'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_remediation_steps'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '24360b3d62594b3c8761edce54f1a131'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '254f6cb7e5534e668b0dc0660ad9866c'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_medium_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '273dda50281b4f02bab81d29981c8aa5'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_estimated_effort'
                            value: 'weeks'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2abaa1aa9bf24d2cbebe84a14eb507b4'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_severity'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2ad18b4ce13a47c98a9a04e53cbeb327'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '2c1a31a7269644928365f602a5f91314'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_triggered_by'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '33edd8dd66444f13938b834948c44746'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_title'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3781ea9ca8bb4a6bb4f37babe8756692'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_affected_record_sys_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3cd230696df04647a484cdf8f5dc4145'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_domain'
                            value: 'integration'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3d5d560a754e40a7b96701c610ab04b3'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_remediation_steps'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3f6e187ce47d4c389c3864e8f1ce1a69'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '422f6abbe044443fbccceff32d33093b'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '42773ba283cd4545b9d6def0b2aeaa83'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_domain'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '42e30456257a41cea8da1801ba87b9f2'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_duration_seconds'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '430a6183ccc9464ca5b74c9d0d0b1be1'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_status'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '4354685645c14997810b9b2cc4014d76'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_domain'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '451e1e95ecde46a0a0af7970581a9273'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '4b49ddcecc6a420eb8fa484b9358cdd9'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_estimated_effort'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4bd2793d69b949c0941c43885858a317'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_scan_type'
                            value: 'on_demand'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4c3d7f1362334929bd7021b555bd4941'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_ai_status'
                            value: 'pending'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4d9d7f6c4f4f4720a52b83c8dd42a20c'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_estimated_effort'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4e45cc070e624497918e2814c27d4dd6'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_severity'
                            value: 'critical'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4f5919d2985f42c9acfcfb056d35fc3c'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_status'
                            value: 'running'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '523526391a0d44ad942f54bbddb28625'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_modules_completed'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5471bf1523d94639adcff27c78ce9352'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_score_delta'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5480296e42954a09af3f50f1fd1d8070'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '598f0d7645534b5cabfcf7c3c8e90bca'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_severity_confirmed'
                            value: 'high'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5a318ce2d3414a148e8cb8425f8fb6bf'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_status'
                            value: 'partial'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5a37e647ffd7447fbd1dca1fe3b5e1f1'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_ai_recommendation'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5be230ac39f5492a83db703d2f5cff2c'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_previous_score'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5e35ebe00bc74c0dae5150acf7aa5d9c'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_severity'
                            value: 'high'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5ece993600af403faa9591f37be0c81c'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_scan_run'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5efbc7e5caa34a2f8c24ef9596340b42'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_score'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5f0f3b56a1d8468a85a1fe0a55d5b3be'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_finding_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5f8dd9353ad244e088b4c8c3e05119b6'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_business_impact'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6131c1d8d8e7481aa75e1583e75ba124'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_estimated_effort'
                            value: 'days'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '61481e5518d74d5cad6b1b93009b491d'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_domain'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '62e909740f6943de93b0f68d4eca80f2'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_ai_status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '637e0e9ce0344333bff870a932b220e6'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_severity_confirmed'
                            value: 'low'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6537bc58b68e44099585c2b0382bf71d'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_remediation_status'
                            value: 'in_progress'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '68e57d6ae12845dba7903c7e7f6c7c9f'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_severity'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6a0a5eebb12b4d0fa9bb50ed44f667aa'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_severity'
                            value: 'low'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6bc6329e13214f3ba56092eff7ee1b02'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_triggered_by'
                            value: 'manual'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '6d177f4ed1784740b5d1a140b0f4e4f2'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7078112900874a9e9582df939b66db76'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_scan_run'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '71f0ac5f44c649b4af3170e01a2e5ddc'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_triggered_by'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '722b3a7c641943c59a2f4b70eada1dc4'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_remediation_status'
                            value: 'accepted_risk'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '774c4f7251d348748491017a7c55a831'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_severity_confirmed'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '77dd7ef9b67e451b9ae1f120736e1773'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_remediation_status'
                            value: 'resolved'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7988c920b7f0428891107b7cc3e29a30'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_completed_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '7c81c4da99564b43b1f020b805398053'
                        key: {
                            name: 'x_gov_copilot_finding'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7e1f3d0f24e647f4bc07ba50cadf9836'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_domain'
                            value: 'cmdb'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '82108887ae0e4d94acfdbdb5bdb61d15'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_finding_type'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8263d15c4be4443f86101fb34e60eaf4'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_domain'
                            value: 'security'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8450453814db4ea48569a622504c8e1e'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_domain'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '84e6468d599c4fcab3bd336eb0b53f6f'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_affected_table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '84ed39c2839d4847b07138cc74cba580'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_ai_status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8558a92ae1fc4b33bc73c979fe199fc6'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_affected_table'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '860b8369d0b649ceba7789d46e4f9f2a'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_finding'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8c6fe479b0354e1c9d416f5789cbe0b0'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8e7726be6149435fa9205ca53fa55315'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_description'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9103657eb4d14c91ac0f6c80427c4675'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_remediation_status'
                            value: 'open'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '93e2a29a788f4dea9d1291128156ef04'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_severity_confirmed'
                            value: 'medium'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '93e3e66ba2de4d38a50951c177af9c31'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_finding'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '97c7871a2d8b450aa0e277499edc4f88'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9b3f009bd1254afdb77607e3a8ae72c9'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_started_at'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9f16805c25b64866b929df8e40474bdc'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_domain'
                            value: 'catalog'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a021c70ebdf14c9a91f9d71f69be4811'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_domain'
                            value: 'cmdb'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a1303b6318b048fca3973db4c225ea70'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_severity'
                            value: 'medium'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a2c348a438264fc69df0631a83282d93'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_estimated_effort'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a2f794c3346949a8ac1c29e5628e19d6'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_domain'
                            value: 'integration'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a3571d35a5e04336b84b0c83ca6b1c0e'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_domain'
                            value: 'performance'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'a35bc765981c458682a710e4b7799c8e'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a484b3b0dd1b4bc499e216008cd0a3af'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_ai_model_used'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a4e3e967eb6d4b0cbbdd0516bc85ab24'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_scan_run'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a62ee56ebd6d4c5e9e3f0c02fe080a23'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a78cbd99bf4d4ba589a7752e61618cd5'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_critical_count'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a7bd95cf320c4bb39b3df742c1057f9a'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_severity_confirmed'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a8040b121c4749cfa4fbc64fa97cc5e4'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_low_count'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'aab4bd73ea13416da16cd5a4a19d5773'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_technical_impact'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ac0ebee95bcc4d86917aeeb83c4c67d8'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_affected_record_sys_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'addbd8097d194a3e87b165893505af21'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_remediation_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'af0b19cf1d694a86b6ce799a43be3151'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_domain'
                            value: 'performance'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'af54f029f0964b8a89d5a39731a65e14'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'afa59609f77747bbbeb6ac5dc062ba15'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_title'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b3996f6b45d448bb9e6173deef3408cb'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_expected_benefit'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b3ce866a55d24838999f283790818072'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b4bc822e13dc4ff597d3dbcf5fe6dfb6'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_affected_record_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b7a011fa9e384b1da48e71f99872cda7'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_medium_count'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'b7b85fe5cfff4ff8a9d351c8dc3e4cd4'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_domain'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bb3d300c50174d0ea02c0519a2fdb83c'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_overall_health_score'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bc7f0ea457c24f028a44d5d8351281d8'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_scan_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c27bd005342540b296839571fd2b37a1'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_modules_completed'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c2b2f57dc59840e882ac881a14d28730'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_ai_status'
                            value: 'failed'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c3574a6162c54a6c9dfd38b3d5753779'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c5dc800e758c4672a97d8a2ae1944f58'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_severity_confirmed'
                            value: 'critical'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c644f0ed8bcd444cba8ccaf9e4f01f23'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_name'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'c89500316a0a4fd1944e38b1613ff800'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_remediation_status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c897223ef9174e9d8a8feed0044969d9'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_ai_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c9f8c831898b4cab8fef881b5845cfca'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_business_impact'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cc0a273c254f47d1835bc30b4621ca6f'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_technical_impact'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cc3558c6da3f470196df36243b4ed15c'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_completed_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cdfc0a55fa1a440896d991785c084e37'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_domain'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cf5f08668c864e119082fe26ef1a3005'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_scan_run'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd01d249a0eec4a4b921e5e4324494059'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_affected_record_name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd1f6a39b45bf42db83c5a5ea79fba007'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_high_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd4adc88cc56344af896c043833e77a23'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd645ee61702a4ff98ead4985340d81fe'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_generated_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd709fe85bb864a39aac0b12d19fa5f9a'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_expected_benefit'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd868cebaba8c489daa1ac09ad76f9b2a'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_severity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'dc537734d20249c792cdaa299d98998d'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_ai_status'
                            value: 'unavailable'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'df2714c319764025822bcf088f04d7c1'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_triggered_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dfc6d76bbb204feeaa1741bef96581e6'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_score_delta'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'e205744e44914e2eb9fbdff155dd5402'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e39242fdf3ad4b08a69c7d0064ca5d52'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_overall_health_score'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e3fa82ff994945b6afe8997024355235'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_domain'
                            value: 'catalog'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'eee8a1f591a24c93a7e5b9ebbeb7596b'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_modules_failed'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'eee9791e8a4c4765880913aef1094c64'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_high_count'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f027847264e34c869d8595e210b656f2'
                        key: {
                            name: 'x_gov_copilot_recommendation'
                            element: 'x_gov_copilot_ai_status'
                            value: 'generated'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f13f0bf7d92d4a3792746f423d91bfa2'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_status'
                            value: 'pending'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f3b037a3fb6843e29bc48ecb0e8e1e18'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_low_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f3efb6c8ab934be5816028a047265ad3'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_domain'
                            value: 'security'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f952b25db0db4699a2f042ca8e92a296'
                        key: {
                            name: 'x_gov_copilot_domain_score'
                            element: 'x_gov_copilot_score'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fb4ef3cbc66d4b9f8132314984b841b3'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_ai_recommendation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fcea764bdb334d3ea7e691b9907b1ca1'
                        key: {
                            name: 'x_gov_copilot_finding'
                            element: 'x_gov_copilot_remediation_status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ffb9e79ad39a453d9704964df5c209b1'
                        key: {
                            name: 'x_gov_copilot_scan_run'
                            element: 'x_gov_copilot_critical_count'
                            language: 'en'
                        }
                    },
                ]
            }
        }
    }
}
